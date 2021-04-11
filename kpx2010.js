

var delaunayTriangulation = [];

//Delaunator Delaunay triangulation.
var delaunay = null;



function KPX2010(P, degree=14) {
  //ensure valid k (max degree)
  const k = Math.max(14, degree);
  const alpha = 2*PI/k;

  const FINAL_DEGREE_BOUND = k;

  // Step 1
  var DT = createDelaunayTriangulation(P);
  const n = delaunayTriangulation.length;

  //Used for animation.
  var selectedLines = new Map();

  // Step 2, go through Delaunay triangulation vertices
  var G_prime = new Map();

  for(var m=0; m<n; m++) {
    //console.log(m);
    //eventQueue.push(new HighlightEvent("line", [], -1 )); // clear any highlighted edges
    eventQueue.push(new HighlightEvent("point", P[m], 0));

    // get neighbors of i
    var N = DT[m];

    // Find closest vertex in each cone
    var selected = new Array(k).fill(Infinity);

    // Selected lines for animation
    

    // establish reference point for m's cones
    var refPoint = pointSet[m].slice();
    refPoint[1] += 1;

    // Loop through neighbors and consider forward edges
    for( var j=0; j<N.length; j++ ) {
      if( isFinite(N[j]) ) {
        eventQueue.push(new HighlightEvent("line", [P[m],P[N[j]]], 0));
        var theta = angle(
          refPoint,
          pointSet[m],
          pointSet[N[j]]
        );
        var cone = Math.floor(theta/alpha);
        if(!isFinite(N[selected[cone]])
        || distance(pointSet[m],pointSet[N[j]])
        < distance(pointSet[m],pointSet[N[selected[cone]]])) {
          if(selected[cone] != Infinity){
            eventQueue.push(new GraphEvent("line", "remove", [P[m], P[N[selected[cone]]]], semiActiveEdgeStyle));
          }

          selected[cone] = j;

          var edgeStyle = semiActiveEdgeStyle;

          if(selectedLines.has(makeEdgePair(m, N[j]))){
            //console.log("CHANGED");
            edgeStyle = activeEdgeStyle;
          }
          eventQueue.push(new GraphEvent("line", "add", [P[m], P[N[j]]], edgeStyle));
          selectedLines.set(makeEdgePair(m, N[j]), "");
        }
      }
    }
    //console.log(selected);

    // Now we must find every maximal sequence of empty cones
    var l=0; // size of maximal sequence
    var l_local = 0; // size of current sequence
    var offset = 0; // in case an empty set wraps around the start of the container
    var startOfSequence = 0; // start of the current empty sequence
    var startOfMaximalSequences = [];

    for( var j=0; j<(k+offset); ++j ) {
      if( !isFinite( N[selected[j%k]] ) ) { // empty cone
        ++l_local;          // increment
        if( l_local > l ) {  // biggest thus far, clear old starts and update l
          startOfMaximalSequences = [];
          l = l_local;
        }
        if( l_local >= l )  // place the current start in the list
          startOfMaximalSequences.push( startOfSequence );
        if( j+1 == k+offset ) {  // if we're about to end but on an empty sequence, keep going
          ++offset;
        }
      } else {                    // filled cone
        l_local = 0;                 // reset l_local
        startOfSequence = (j+1) % k; // set the start of sequence to the next i
      }
    }
    //console.log(startOfMaximalSequences);
    //console.log(l);
    for( var j=0; j<startOfMaximalSequences.length; j++ ) {
      var startAngle = startOfMaximalSequences[j]*alpha;
      // find indices in N of first neighbors before and after empty cone(s)
      var beforeSeq = selected[(startOfMaximalSequences[j]-1+k)%k];
      var afterSeq = selected[(startOfMaximalSequences[j]+l)%k];
      //console.log(beforeSeq, afterSeq);

      if(l>1) {
        // select the first ceil(l/2) unselected edges CCW
        var remainingToAdd = Math.ceil(l/2);
        for(var c=beforeSeq+N.length;
          c>afterSeq&&remainingToAdd>0;
          c--)
        {
          if(isFinite(N[c%N.length]) && !selected.includes(c%N.length)) {
            selected.push(c%N.length);
            remainingToAdd--;
          }
        }
        // select the first floor(l/2) unselected edges CW
        var remainingToAdd = Math.floor(l/2);
        for(var c=afterSeq;
          c<beforeSeq+N.length&&remainingToAdd>0;
          c++)
        {
          if(isFinite(N[c%N.length]) && !selected.includes(c%N.length)) {
            selected.push(c%N.length);
            remainingToAdd--;
          }
        }
      } else if(l==1) {
        // consider the first CW and CCW edges (held in beforeSeq and afterSeq)
        var singleSelection = Infinity;
        // if one is selected already, add the other
        if(selected.includes(beforeSeq) != selected.includes(afterSeq)) {
          singleSelection = selected.includes(beforeSeq) ? afterSeq : beforeSeq;
        }
        // otherwise, add the shorter
        else if( !(selected.includes(beforeSeq) || selected.includes(afterSeq))) {
          singleSelection =
            distance(m, N[beforeSeq]) < distance(m, N[afterSeq]) ?
              beforeSeq : afterSeq;
        }

        // if we found one to select, select it!
        if(isFinite(singleSelection)) {
          selected.push(singleSelection);
        }
      }
    }
    //console.log(selected);

    if(!G_prime.has(m))
      G_prime.set(m, new Map() );
    // Mark m's selected edges in G_prime
    for( var j=0; j<selected.length; j++ ) {
      if( isFinite(selected[j]) ) {
        ////console.log(G_prime.get(m).has(N[selected[j]]));
        if(!G_prime.get(m).has(N[selected[j]]))
          G_prime.get(m).set(N[selected[j]], false);
        else
          G_prime.get(m).set(N[selected[j]], true);

        if( !G_prime.has(N[selected[j]]))
          G_prime.set(N[selected[j]], new Map());

        if(!G_prime.get(N[selected[j]]).has(m))
          G_prime.get(N[selected[j]]).set(m, false);
        else
          G_prime.get(N[selected[j]]).set(m, true);
      }
    }
  }

  // Done with selecting. Now add edges from G_prime with value == true to output
  var G = new Map;
  for( let [v,e] of G_prime.entries() ) {
    if( !G.has(v) )
      G.set(v, []);
    for( let [u,chosen] of e ) {
      if(chosen) {
        G.get(v).push(u);
      }
    }
  }
  //console.log(G_prime);
  //console.log(G);
  return G;
}

function addEdge( G, a, b ) {
  if( !G.has(a) )
    G.set(a, []); // initialize adjacency list for vertex
  if( !G.get(a).includes(b) )
    G.get(a).push(b);

  if( !G.has(b) )
    G.set(b, []); // initialize adjacency list for vertex
  if( !G.get(b).includes(a) )
    G.get(b).push(a);
}
