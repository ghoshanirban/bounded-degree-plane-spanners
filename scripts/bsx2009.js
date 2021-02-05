

var delaunayTriangulation = [];

//Delaunator delaunay triangulation.
var delaunay = null;

//Verifies steps compleetion.
var stepCompletion = [false,false,false];

function BSX2009(P, alpha = (2*PI)/3) {
  //ensure valid alpha
  alpha = Math.min(alpha, (2*PI)/3);
  alpha = Math.max(EPSILON, alpha);

  const numCones = Math.ceil((2*PI)/(alpha)-EPSILON);
  if( numCones <= 0 ) {
    console.log("CONE ERROR!");
    return;
  }
  const alphaReal = (2*PI) / numCones;
  const FINAL_DEGREE_BOUND = 14 + numCones;

  // Step 1
  var DT = createDelaunayTriangulation(P);
  const n = delaunayTriangulation.length;

  // Step 2
  // put copy of delaunay in a temp variable we can modify
  var dtTemp = [];
  for( var i=0; i<n; i++ ) {
    dtTemp[i] = [];
    for( var j=0; j<n; j++ )
      if(isFinite(DT[i][j]))
        dtTemp[i].push( DT[i][j] );
  }
  //console.log(DT);

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
    console.log(u);
    // get neighbors of u
    var N = DT[u];
    //console.log(N);
    // try to find a processed neighbor
    var closest = 0;
    var d_closest = Infinity;
    var processedNeighbors = 0;
    //var degree = 0;
    var processedNeighs = [];
    // find closest unprocessed neighbor
    for(var j=0; j<N.length; ++j) {
      //if( isProcessed[u] ) processedNeighbors++;
      if( isFinite(N[j]) ) {
        processedNeighbors += isProcessed[N[j]];
        if(isProcessed[N[j]])
          processedNeighs.push(N[j]);
        if( !isProcessed[N[j]] && distance(pointSet[u], pointSet[N[j]]) < d_closest ) {
          closest = j;
          d_closest = distance(pointSet[u], pointSet[N[j]]);
        }
      }
    }
    //console.log("processedNeighbors",processedNeighs);
    //console.log(N[closest]);

    if( E_prime.has(u) && E_prime.get(u).length > 15 ) {
      console.log("DEGREE ERROR!");
      return;
    }
    if( E_prime.has(u) && processedNeighbors > 5 ) {
      console.log( "PROCESSED NEIGHBORS ERROR!");
      return;
    }
    // We will add a max of numCones-1 since we are guaranteed to add the closest
    // but cannot add to the two cones touching closest.
    var closestInCones = new Array(numCones-1).fill(Infinity);
    closestInCones[0] = closest; // add closest to "add" list

    // Loop through neighbors and consider forward edges
    for( var j=closest+1; j<N.length+closest; j++ ) {
      //console.log(N[j%N.length]);
      if( isFinite(N[j%N.length]) && !isProcessed[N[j%N.length]] ) {
        var theta = angle(
          pointSet[N[closest]],
          pointSet[u],
          pointSet[N[j%N.length]]
        );
        var cone = Math.floor(theta/alphaReal);
        // trap neighbors in forbidden cones by putting them in 0 (already guaranteed to be closest)
        cone = (cone<closestInCones.length ? cone : 0);
        //console.log( N[j%N.length], theta, cone, distance(pointSet[u],pointSet[N[j%N.length]]) );
        if(cone > 0 // banish the forbidden cones
          && (!isFinite(closestInCones[cone])
            || (distance(pointSet[u],pointSet[N[j%N.length]])
              < distance(pointSet[u],pointSet[N[closestInCones[cone]]])))) {
          closestInCones[cone] = j%N.length;
        }
      }
    }
    //console.log(closestInCones);

    // We've found all the closest neighbors in each cone,
    // now add edges from each to the current vertex (u)
    for( var j=0; j<closestInCones.length; j++ ) {
      if( isFinite(N[closestInCones[j]]) ) {
        addEdge( E_prime, u, N[closestInCones[j]]);
      }
    }

    // Loop through neighbors again and add cross edges between
    // consecutive neighbors that are NOT processed (or infinite).
    for( var j=0; j<N.length; j++ ) {
      if( isFinite(N[j])
      && !isProcessed[N[j]]
      &&  isFinite(N[(j+1)%N.length])
      && !isProcessed[N[(j+1)%N.length]]) {
        addEdge( E_prime, N[j], N[(j+1)%N.length] );
      }
    }
    // Lemma 3
    if( E_prime.get(u).length > FINAL_DEGREE_BOUND ) {
      console.log("DEGREE ERROR!");
      return;
    }
    //break;
  }
  //console.log(E_prime);
  //drawGraph(E_prime);
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
