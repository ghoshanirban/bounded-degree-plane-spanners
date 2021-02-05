

var delaunayTriangulation = [];

//Delaunator delaunay triangulation.
var delaunay = null;

function BCC2012(P, degree=7) {
  //ensure valid k (max degree)
  const k = Math.max(6, Math.min(7, degree));
  const NUM_CONES = k+1;
  const alpha = 2*PI/NUM_CONES;

  const FINAL_DEGREE_BOUND = k;

  // Step 1
  var DT = createDelaunayTriangulation(P);
  const n = P.length;

  // Get a list of edges
  let L = [];
  let containedInL = true;
  for( var i=0; i<DT.length; i++ ) {
    for( var j=0; j<DT[i].length; j++ ) {
      let e = [i,DT[i][j]];
      e.sort( function(l,r) { // make sure e is in order
        return l-r;
      });
      containedInL = L.some( function(row) {
        return row.includes(e[0]) && row.includes(e[1]);
      });
      if( e[1] != Infinity && !containedInL ) {
        L.push(e);
      }
    }
  }
  //console.log(L);
  //console.log(P);

  // Sort the edges by their length
  L.sort( function(l,r) {
    var p1 = P[l[0]],
        q1 = P[l[1]],
        p2 = P[r[0]],
        q2 = P[r[1]];
    return distance(p1,q1) - distance(p2,q2);
  });

  let closest = new Array(n).fill(Infinity);
  let filled = new Array(n);
  for( let i=0; i<n; i++ )
    filled[i] = new Uint8Array(8);

  let E = [];
  let E_star = [];

  // Some functions needed in the main loop

  // Return the sum of values in a container
  const summation = function (accumulator, currentValue) {
    return accumulator + currentValue;
  };
  // Return the cone of point p in which point q lies
  const getCone = function(p, q) {
    return Math.trunc( angle( P[closest[p]], P[p], P[q] ) / alpha );
  };
  // Given a cone number, return a valid previous cone
  const getPreviousCone = function(cone) {
    return (cone+NUM_CONES-1) % NUM_CONES;
  };

  const wedge = function(params) {
    const PI_OVER_2 = PI/2;
    const p = params[0],
          q = params[1],
          cone = params[2];

    const N = DT[p];
    let i = N.indexOf(q),
        j = i, // first vertex in cone
        k = i; // last vertex in cone
    const w = N.length; // number of neighbors
    console.log(p, q, cone, i);
    console.log(N);
    // find j
    for( j=i+w;
         N[j%w]!=Infinity && getCone(p,N[j%w])==cone;
         j-- );
    j = (j+1)%w; // go back one!
    // find k
    for( k=i;
         N[k%w]!=Infinity && getCone(p,N[k%w])==cone;
         k++ );
    k = (k-1)%w; // go back one again!

    let addToE_star = [];
    // Line 3
    for( let m=j+1; m<i-1; m++ ) {
      addToE_star.push( [N[m%w], N[(m+1)%w]] );
      eventQueue.push(new GraphEvent("line", "highlight", [P[N[m%w]], P[N[(m+1)%w]]], 1));
      eventQueue.push(new GraphEvent("line", "add", [P[N[m%w]], P[N[(m+1)%w]]]));
    }
    // Line 4
    for( let m=i+1; m<k-1; m++ ) {
      addToE_star.push( [N[m%w], N[(m+1)%w]] );
      eventQueue.push(new GraphEvent("line", "highlight", [P[N[m%w]], P[N[(m+1)%w]]], 1));
      eventQueue.push(new GraphEvent("line", "add", [P[N[m%w]], P[N[(m+1)%w]]]));
    }

    let i_plus_1 = (i+1)%w;
    if(  i_plus_1 != k
      && N[i_plus_1] != Infinity
      && getCone(p,N[i_plus_1]) == cone
      && angle( P[N[i_plus_1]], P[N[i]], P[p] ) > PI_OVER_2 )
    {
      eventQueue.push(new GraphEvent("line", "highlight", [P[N[i]], P[N[i_plus_1]]], 1));
      addToE_star.push( [N[i], N[i_plus_1]] );
      eventQueue.push(new GraphEvent("line", "add", [P[N[i]], P[N[i_plus_1]]]));
    }

    let i_minus_1 = (i-1+w)%w;
    if(  i_minus_1 != k
      && N[i_minus_1] != Infinity
      && getCone(p,N[i_minus_1]) == cone
      && angle( P[p], P[N[i]], P[N[i_minus_1]] ) > PI_OVER_2 )
    {
      eventQueue.push(new GraphEvent("line", "highlight", [P[N[i]], P[N[i_plus_1]]], 1));
      addToE_star.push( [N[i], N[i_minus_1]] );
      eventQueue.push(new GraphEvent("line", "add", [P[N[i]], P[N[i_plus_1]]]));
    }

    return addToE_star;
  };

  const wedge6 = function(params) {
    const SIX_PI_OVER_SEVEN = 6*PI/7;
    const FOUR_PI_OVER_SEVEN = 4*PI/7;

    const p = params[0],
          q = params[1],
          cone = params[2];

    const N = DT[p];
    let m = N.indexOf(q);
    let r = 0;
    const w = N.length; // number of neighbors
    console.log(p, q, cone, m);
    console.log(N);
    // find j
    for( r=m+w;
         N[r%w]!=Infinity && ( N[r%w]==q || getCone(p,N[r%w])==cone );
         r-- );
    console.log(r%w);
    let Q = [];
    // put all neighbors between j and k (inclusive) in Q
    for( r=(r+1) % w;
         N[r%w]!=Infinity && ( N[r%w]==q || getCone(p,N[r%w])==cone );
         r++ ) {
      Q.push(N[r%w]);
    }
console.log(r);

    let Q_prime = [];
    let i = Q.indexOf(q),
        j = 0, // first vertex in cone
        k = Q.length-1; // last vertex in cone
    let between_i_k = 2;

    for( let n=j+1; n<k; n++ ) {
      if( n != i
       && angle( P[n+1], P[n], P[n-1] ) < SIX_PI_OVER_SEVEN ) {
         Q_prime.push(Q[n]);
         between_i_k = Number(n>i);
       }
    }

    let addToE_star = [];
    // Line 4
    for( let n=j+1; n<i-2; n++ ) {
      eventQueue.push(new GraphEvent("line", "highlight", [P[Q[n]], P[Q[n+1]]], 1));
      if( !Q_prime.includes(Q[n]) && !Q_prime.includes(Q[n+1]) )
        addToE_star.push( [Q[n], Q[n+1]] );
        eventQueue.push(new GraphEvent("line", "add", [P[Q[n]], P[Q[n+1]]]));
    }
    for( let n=i+1; n<k-2; n++ ) {
      eventQueue.push(new GraphEvent("line", "highlight", [P[Q[n]], P[Q[n+1]]], 1));
      if( !Q_prime.includes(Q[n]) && !Q_prime.includes(Q[n+1]) )
        addToE_star.push( [Q[n], Q[n+1]] );
        eventQueue.push(new GraphEvent("line", "add", [P[Q[n]], P[Q[n+1]]]));
    }
    let f = i, // will hold the index in Q of the first point in Q_prime
        a = i;

    // Line 5
    if ( between_i_k == 1 ) {
      // Line 6-7
      console.log(Q);
      console.log( p, Q[i], Q[i-1] );
      eventQueue.push(new GraphEvent("line", "highlight", [P[Q[i]], P[Q[i-1]]], 1));
      if( i != j
       && i-1 != j
       && angle( P[p], P[Q[i]], P[Q[i-1]] ) > FOUR_PI_OVER_SEVEN ) {
         addToE_star.push( [Q[i], Q[i-1]] );
         eventQueue.push(new GraphEvent("line", "add", [P[Q[i]], P[Q[i-1]]]));
      }
      while( ++f < Q.length && !Q_prime.includes(Q[f]) );
      a = f - Number(f==Q.length)*Q.length;
      while( ++a < Q.length && Q_prime.includes(Q[a]) );
      if( f == i+1 ) {
        eventQueue.push(new GraphEvent("line", "highlight", [P[Q[f]], P[Q[a]]], 1));
        if( a != k && angle( P[Q[i+1]], P[Q[i]], P[p] ) < FOUR_PI_OVER_SEVEN ) {
          addToE_star.push( [Q[f], Q[a]] );
          eventQueue.push(new GraphEvent("line", "add", [P[Q[f]], P[Q[a]]]));
        }
        eventQueue.push(new GraphEvent("line", "highlight", [P[Q[i]], P[Q[f+1]]], 1));
        if( i != j
         && i !=k
         && f+1 != k
         && angle( P[Q[i+1]], P[Q[i]], P[p] ) > FOUR_PI_OVER_SEVEN ) {
           addToE_star.push( [Q[i], Q[f+1]] );
           eventQueue.push(new GraphEvent("line", "add", [P[Q[i]], P[Q[f+1]]]));
         }
      } else {
        let l = Q.length;
        while( --l > 0 && !Q_prime.includes(Q[l]) );
        if( l > 0 ) {
          let b = l;
          while( --b > 0 && Q_prime.includes(Q[b]) );

          eventQueue.push(new GraphEvent("line", "highlight", [P[Q[l]], P[Q[b]]], 1));
          if( l== k-1 ) {
            addToE_star.push( [Q[l], Q[b]] );
            eventQueue.push(new GraphEvent("line", "add", [P[Q[l]], P[Q[b]]]));
          } else {
            addToE_star.push( [Q[b], Q[l+1]] );
            eventQueue.push(new GraphEvent("line", "highlight", [P[Q[b]], P[Q[l+1]]], 1));
            eventQueue.push(new GraphEvent("line", "add", [P[Q[b]], P[Q[l+1]]]));

            eventQueue.push(new GraphEvent("line", "highlight", [P[Q[l]], P[Q[l-1]]], 1));
            if( Q_prime.has(Q[l-1]) ) {
              addToE_star.push( [Q[l], Q[l-1]] );
              eventQueue.push(new GraphEvent("line", "add", [P[Q[l]], P[Q[l-1]]]));
            }
          }
        }
      }
    } else if( between_i_k == 0 ){

      eventQueue.push(new GraphEvent("line", "highlight", [P[Q[i]], P[Q[i+1]]], 1));
      // Line 6-7
      if( i != k
       && i+1 != k
       && angle( P[i+1], P[Q[i]], P[p] ) > FOUR_PI_OVER_SEVEN ) {
         addToE_star.push( [Q[i], Q[i+1]] );
         eventQueue.push(new GraphEvent("line", "add", [P[Q[i]], P[Q[i+1]]]));
      }
      while( --f > 0 && !Q_prime.includes(Q[f]) );
      a = f + Number(f==0)*Q.length;
      while( --a > 0 && Q_prime.includes(Q[a]) );
      if( f == i-1 ) {
        eventQueue.push(new GraphEvent("line", "highlight", [P[Q[f]], P[Q[a]]], 1));
        if( a != j && angle( P[p], P[Q[i]], P[Q[i-1]] ) < FOUR_PI_OVER_SEVEN ) {
          addToE_star.push( [Q[f], Q[a]] );
          eventQueue.push(new GraphEvent("line", "add", [P[Q[f]], P[Q[a]]]));
        }
        eventQueue.push(new GraphEvent("line", "highlight", [P[Q[i]], P[Q[f-1]]], 1));
        if( i != j
         && i != k
         && f-1 != j
         && angle( P[p], P[Q[i]], P[Q[i-1]] ) > FOUR_PI_OVER_SEVEN ) {
           addToE_star.push( [Q[i], Q[f-1]] );
           eventQueue.push(new GraphEvent("line", "add", [P[Q[i]], P[Q[f-1]]]));
         }
      } else {
        let l = 0;
        while( ++l < Q.length && !Q_prime.includes(Q[l]) );
        if( l > 0 ) {
          let b = l;
          while( ++b < Q.length && Q_prime.includes(Q[b]) );

          eventQueue.push(new GraphEvent("line", "highlight", [P[Q[l]], P[Q[b]]], 1));
          if( l== j+1 ) {
            addToE_star.push( [Q[l], Q[b]] );
            eventQueue.push(new GraphEvent("line", "add", [P[Q[l]], P[Q[b]]]));
          } else {
            addToE_star.push( [Q[b], Q[l-1]] );
            eventQueue.push(new GraphEvent("line", "highlight", [P[Q[b]], P[Q[l-1]]], 1));
            eventQueue.push(new GraphEvent("line", "add", [P[Q[b]], P[Q[l-1]]]));

            eventQueue.push(new GraphEvent("line", "highlight", [P[Q[l]], P[Q[l+1]]], 1));
            if( Q_prime.includes(Q[l+1]) ) {
              addToE_star.push( [Q[l], Q[l+1]] );
              eventQueue.push(new GraphEvent("line", "add", [P[Q[l]], P[Q[l+1]]]));
            }
          }
        }
      }
    }

    return addToE_star;
  }; // end wedge6

  // The main loop
  L.forEach( function(e) {
    // If the cones are full, continue this iteration of forEach
    for( let i=0; i<e.length; i++ )
      if( filled[e[i]].reduce(summation, 0) == 8 )
        return;

    const p = e[0];
    const q = e[1];



    // politely ask p if it wants an edge to q
    if( closest[p] == Infinity ) {
      closest[p] = q;
    }
    let qOnBoundary = closest[p]==q;
    let cone_p = getCone(p,q),
      cone_pPrev = getPreviousCone(cone_p);
    let pGivenConeFilled = filled[p][cone_p],
        pPrevConeFilled = filled[p][cone_pPrev];
    let pAbides = (!qOnBoundary && !pGivenConeFilled)
               || ( qOnBoundary &&(!pGivenConeFilled || !pPrevConeFilled) );

    // politely ask q if it wants an edge to p
    if( closest[q] == Infinity ) {
      closest[q] = p;
    }
    let pOnBoundary = closest[q]==p;
    let cone_q = getCone(q,p),
      cone_qPrev = getPreviousCone(cone_q);
    let qGivenConeFilled = filled[q][cone_q],
        qPrevConeFilled = filled[q][cone_qPrev];
    let qAbides = (!pOnBoundary && !qGivenConeFilled)
               || ( pOnBoundary &&(!qGivenConeFilled || !qPrevConeFilled) );

		eventQueue.push(new GraphEvent("line", "highlight", [P[e[0]], P[e[1]]], 0));

    // p and q agree
    if( pAbides && qAbides ) {
      E.push(e);
  		eventQueue.push(new GraphEvent("line", "add", [P[e[0]], P[e[1]]]));

      let W = []; // all the cones containing edge pq and qp

      // Update cone status
      console.log(filled);
      // p
      if(qOnBoundary) { // if q is on a boundary, fill both cones
        if(!filled[p][cone_pPrev])
          W.push([p,q,cone_pPrev]); // gonna wedge it
        filled[p][cone_pPrev] = 1;
        //console.log(p, cone_pPrev);
      }
      if(!filled[p][cone_p])
        W.push([p,q,cone_p]);
      filled[p][cone_p] = 1;
      //console.log(p, cone_p);

      // q
      if(pOnBoundary) {
        if(!filled[q][cone_qPrev])
          W.push([q,p,cone_qPrev]);
        filled[q][cone_qPrev] = 1;
        //console.log(q, cone_qPrev);
      }
      if(!filled[q][cone_q])
        W.push([q,p,cone_q]);
      filled[q][cone_q] = 1;
      //console.log(q, cone_q);

      // for each cone containing
      W.forEach( function(params) {
        // call wedge and add each returned edge to E_star
        (k==7 ? wedge(params) : wedge6(params)).forEach( function(e) {
          E_star.push(e);
        });
      });
    }

  }); // end main loop body

console.log(closest);
console.log(filled);
  // console.log(G_prime);
  console.log(E);
  // build a map-based adjacency list for output
  var G = new Map();
  E.forEach( function(e) {
    const a = e[0],
          b = e[1];
    if( !G.has(a) )
      G.set(a, []); // ititilize adjacency list for vertex
    if( !G.get(a).includes(b) )
      G.get(a).push(b);

    if( !G.has(b) )
      G.set(b, []); // ititilize adjacency list for vertex
    if( !G.get(b).includes(a) )
      G.get(b).push(a);
  });
  return G;
}
