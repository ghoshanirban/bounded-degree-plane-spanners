

var delaunayTriangulation = [];

//Delaunator delaunay triangulation.
var delaunay = null;


function LW2004(P, alpha = PI/2) {
  // Step 1
  var DT = createDelaunayTriangulation(P);
  const n = delaunayTriangulation.length;

  // Step 2
  // put copy of delaunay in a temp variable we can modify
  var dtTemp = [];
  for( var i=0; i<n; i++ ) {
    dtTemp[i] = [];
    for( var j=0; j<n; j++ )
      if(isFinite(delaunayTriangulation[i][j]))
        dtTemp[i].push( delaunayTriangulation[i][j] );
  }
  console.log(DT);

  // make an array of indices so we can sort
  var dtOrdering = [];
  for( var i=0; i<n; i++ ) {
    dtOrdering[i] = i;
  }

  var lowDegreeOrdering = [];
  while( lowDegreeOrdering.length < n ) {
    // sort the dt ordering
    dtOrdering.sort( function(a,b) { // sort on degree
      return dtTemp[a].length - dtTemp[b].length;
    });
    // remove the index of the highest degree vertex remaining and add to final ordering
    var top = dtOrdering.shift();
    lowDegreeOrdering.unshift(top);
    // remove top from each vertex in dtTemp[top]
    for( var i=0; i<dtTemp[top].length; i++ ) {
      var neighborList = dtTemp[dtTemp[top][i]];
      var topIndexInNeighborList = neighborList.indexOf(top);
      neighborList.splice(topIndexInNeighborList, 1);
    }
  }
  //console.log(lowDegreeOrdering);

  // Step 3
  var isProcessed = new Array(n).fill(false);
  var E_prime = new Map();

  for(var i=0; i<n; i++) {
    var u = lowDegreeOrdering[i];
    isProcessed[u] = true;
    //console.log(u);
    // get neighbors of u
    var N = delaunayTriangulation[u];
    // try to find a processed neighbor
    var start;
    for(start=0;
      start<N.length;
      start++) {
      if(isFinite(N[start]) && isProcessed[N[start]]) {
        break;
      }
    }
    // use modulo to point to the beginning if we made it past the end
    start = start % N.length;
    if(!isFinite(N[start])) ++start; // get off an infinite

    // get number of processed neighbors and sectorBoundaries
    var sectorBoundaries = [ start ];
    var processedNeighbors = isProcessed[N[start]] ? 1 : 0;
    //console.log(start+N.length);
    for( var j=start+1; j<N.length+start; j++ ) {
      var j_norm = j%N.length;
      if(isProcessed[N[j_norm]]) {
        sectorBoundaries.push(j_norm);
        processedNeighbors++;
      }
    }
    // processed neighbors should be <= 5
    //console.log("processedN:"+processedNeighbors);
    //console.log("sectBound:");
    // for (var j=0; j<sectorBoundaries.length; j++) {
    //   console.log(N[sectorBoundaries[j]]);
    // }

    // Compute the angles of the sectors, the number of cones in each sector, and the actual angles
    var alphaReal = [];
    var closest = [[]];

    for( var j=0; j<sectorBoundaries.length; j++ ) {
      var sectorAngle = angle(
        P[N[sectorBoundaries[j]]],
        P[u],
        P[N[sectorBoundaries[(j+1)%sectorBoundaries.length]]]
      );
      sectorAngle += sectorAngle==0 ? 2*PI : 0;
      // console.log(sectorAngle);
      var numCones = Math.ceil(sectorAngle/alpha);
      // console.log(numCones);
      alphaReal[j] = sectorAngle/numCones;
      closest[j] = new Array(numCones).fill(Infinity);
    }

    var lastN = Infinity;
    var thisN = sectorBoundaries[0];
    // console.log("thisNinit:"+N[thisN]);
    // if the initial thisN is processed, we don't want the loop to
    // increment "sector" and we also don't need to process it in the
    // loop since it cannot be added by definition, so step once forward.
    //thisN = (thisN + (isProcessed[N[thisN]]?1:0) ) % N.length;
    // console.log("thisNprep:"+N[thisN]);
    var sector = -1;
    // console.log("looping through neighbors");
    // console.log(sectorBoundaries.length);

    do { // loop through neighbors and add appropriate edges
      if(isFinite(N[thisN])) {
        // console.log(N[thisN]);
        if(sectorBoundaries.includes(thisN))
          sector++;
        // console.log(sector);
        if(!isProcessed[N[thisN]]) {
          if( sector >= sectorBoundaries.length ) {
            console.log("SECTOR ERROR!");
            return;
          }
          // Evaluate forward edges
          // console.log(N[sectorBoundaries[sector]]);
          // console.log(u);
          // console.log(N[thisN]);
          var theta = angle(
            P[N[sectorBoundaries[sector]]],
            P[u],
            P[N[thisN]]
          );


          var cone = Math.floor((theta)/alphaReal[sector]);
          if( cone >= closest[sector].length ) {
            // console.log(theta);
            // console.log(alphaReal[sector]);
            // console.log(cone);
            // console.log("CONE ERROR!");
            return;
          }
          if(!isFinite(closest[sector][cone])
              || distance(P[u], P[N[thisN]])
                < distance(P[u], P[N[closest[sector][cone]]])) {
            closest[sector][cone] = thisN;
          }

          // Evaluate cross edges
          if( isFinite(lastN) && isFinite(N[lastN]) && !isProcessed[N[lastN]] ) {
            addEdge( E_prime, N[thisN], N[lastN] );
          }
        }
      }
      lastN = thisN;
      thisN = (thisN+1)%N.length;
    } while( thisN != sectorBoundaries[0] );

    // If thisN and lastN are not processed, add final cross edge
    if(  isFinite(N[thisN]) && !isProcessed[N[thisN]]
      && isFinite(N[lastN]) && !isProcessed[N[lastN]]) {
      addEdge( E_prime, N[thisN], N[lastN] );
    }

    // Add edges in closest
    for( var j=0; j<closest.length; j++ ) {
      for( var k=0; k<closest[j].length; k++ ) {
        if( isFinite(N[closest[j][k]]) ) {
          addEdge( E_prime, u, N[closest[j][k]] );
        }
      }
    }
  }
  // console.log(E_prime);
  return E_prime;
}

function addEdge( G, a, b ) {
  if( !G.has(a) )
    G.set(a, []); // ititilize adjacency list for vertex
  if( !G.get(a).includes(b) )
    G.get(a).push(b);

  if( !G.has(b) )
    G.set(b, []); // ititilize adjacency list for vertex
  if( !G.get(b).includes(a) )
    G.get(b).push(a);
}
