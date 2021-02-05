
var alpha = PI / 3;

var tan30 = Math.tan(PI / 6);
var cot30 = 1 / tan30;

var bisectorSlopes = [Infinity, tan30, -1*tan30, Infinity, tan30, -1*tan30];
var orthBisectorSlopes = [0, -1*cot30, cot30, 0, -1*cot30, cot30];

function getCone (P, p, q){

	var refPoint = [P[p][0] - tan30, P[p][1] + 1];

	var theta = angle(refPoint, P[p], P[q]);

	var cone  = (theta / alpha);

	return Math.trunc(cone);
}

function maxCone (P, p, q){
	if(p < q){
		return getCone(P, p, q);
	}
	else{
		return (getCone(P, q, p)+3)%6;
	}
}

function bisectorLength(P , p , q){

	var cone = maxCone(P, p, q);

	board.suspendUpdate();

	if(cone == 0 || cone == 3){
		return Math.abs(P[p][1] - P[q][1]);
	}

	var slope = bisectorSlopes[cone];

	var xcoord = ( P[q][0] / slope + P[q][1] + slope * P[p][0] - P[p][1]) / (slope+(1/slope));
	var ycoord = slope*xcoord - slope*P[p][0] + P[p][1];

	var intersectionPoint = [xcoord, ycoord];

	var bisectorLen = distance(P[p], intersectionPoint);

	console.log(p+","+q+":"+bisectorLen);

	return bisectorLen;
}

function addIncident(P, L, E_A, E_ACone){

	for(var i=0; i<L.length; i++){

		var p = L[i][0];
		var q = L[i][1];

		var pCone = maxCone(P, p, q);
		var qCone = maxCone(P, q, p);

		var pConeStatus = E_ACone.has(makeConePair(p,pCone));
		var qConeStatus = E_ACone.has(makeConePair(q,qCone));

		eventQueue.push(new GraphEvent("line", "highlight", [P[p], P[q]], 0));

		if(!pConeStatus && !qConeStatus){
			E_A.push([p,q]);

			eventQueue.push(new GraphEvent("line", "add", [P[p], P[q]]));

			E_ACone.set( makeConePair(p, pCone), q);
			E_ACone.set (makeConePair(q, qCone), p);
		}
	}
}


function canonicalNeighborhood(canNeighbors, p, r, p_cone, B, P, DT){

	var circulator = DT[p].indexOf(r);

	circulator = (circulator-1 + DT[p].length) % DT[p].length;

	while(isFinite(DT[p][circulator]) && getCone(P, p, DT[p][circulator]) == p_cone &&
		((B.get(makeEdgePair(p,DT[p][circulator])) > B.get(makeEdgePair(p,r)) ||
		Math.abs(B.get(makeEdgePair(p,r)) - B.get(makeEdgePair(p, DT[p][circulator])) < EPSILON )))){

		//console.log(DT[p][circulator]);
		circulator = (circulator-1 + DT[p].length) % DT[p].length;
	}

	circulator = (circulator + 1) % DT[p].length;

	while(isFinite(DT[p][circulator]) &&
		getCone(P, p, DT[p][circulator]) == p_cone &&
		((B.get(makeEdgePair(p,DT[p][circulator])) > B.get(makeEdgePair(p,r)) ||
		Math.abs(B.get(makeEdgePair(p,r)) - B.get(makeEdgePair(p, DT[p][circulator])) < EPSILON )))){

		canNeighbors.push(DT[p][circulator]);

		circulator = (circulator + 1) % DT[p].length;
	}
	//console.log(p,r);
	//console.log(canNeighbors);
}

function addCanonical(p, r, E_CAN, E_ACone, B, P, DT){

	var pCone = getCone(P, p, r);

	var canNeighbors = [];

	canonicalNeighborhood(canNeighbors, p, r, pCone, B, P, DT);

	var canEdges = canNeighbors.length -1;

	if(canEdges > 1){

		//4.2
		for(var i=1; i<canEdges-1; i++){
			E_CAN.push([canNeighbors[i], canNeighbors[i+1]]);

			eventQueue.push(new GraphEvent("line", "highlight", [P[canNeighbors[i]], P[canNeighbors[i+1]]], 1));
			eventQueue.push(new GraphEvent("line", "add", [P[canNeighbors[i]], P[canNeighbors[i+1]]]));
		}

		var canExtrema = [[canNeighbors[1], canNeighbors[0]],
						[canNeighbors[canEdges-1], canNeighbors[canEdges]]];

		//4.3
		canExtrema.forEach(function(e){
			eventQueue.push(new GraphEvent("line", "highlight", [P[e[0]], P[e[1]]], 1));
			if(e[1] == r){
				E_CAN.push(e);
				eventQueue.push(new GraphEvent("line", "add", [P[e[0]], P[e[1]]]));
			}
		});


		//4.4

		var cone = new Array(6);
		for(var i=0; i<6; i++){
			cone[i] = (pCone+i)%6;
		}

		//4.4a
		for(var i=0; i<2; ++i){
			var e = canExtrema[i];

			var zCone = 1 + Number(i==1)*4;

			eventQueue.push(new GraphEvent("line", "highlight", [P[e[0]], P[e[1]]], 1));
			if(getCone(P, e[1], e[0]) == cone[zCone]){
				E_CAN.push(e);
				eventQueue.push(new GraphEvent("line", "add", [P[e[0]], P[e[1]]]));
			}
		}

		//4.4b
		var endPointZ = [ E_ACone.get(makeConePair(canExtrema[0], cone[2])),
						E_ACone.get(makeConePair(canExtrema[1], cone[4]))];

		for(var i=0; i<2; ++i){
			var e = canExtrema[i];

			var zCone = 2 + Number(i==1)*2;

			eventQueue.push(new GraphEvent("line", "highlight", [P[e[0]], P[e[1]]], 1));
			if(endPointZ[i] == undefined && getCone(P, e[1], e[0]) == cone[zCone]){
				E_CAN.push(e);
				eventQueue.push(new GraphEvent("line", "add", [P[e[0]], P[e[1]]]));
			}
		}

		//4.4c

		for(var i=0; i<2; ++i){
			var e = canExtrema[i];

			var zCone = 2 + Number(i==1)*2;

			if(getCone(P, e[1], e[0]) == cone[zCone] &&
				endPointZ[i] != undefined &&
				endPointZ[i][1] != e[0]){

				var zCanNeighbors = [];
				canonicalNeighborhood(zCanNeighbors, e[1], endPointZ[1], cone[zCone], B, P, DT);

				var y = zCanNeighbors.indexOf(e[0]);
				var w = y;

				w += Number(y == zCanNeighbors[0]);
				w -= Number(y == zCanNeighbors[zCanNeighbors.length-1]);

				E_CAN.push([zCanNeighbors[y], zCanNeighbors[w]]);

				eventQueue.push(new GraphEvent("line", "highlight", [zCanNeighbors[y], zCanNeighbors[w]], 1));
				eventQueue.push(new GraphEvent("line", "add", [P[zCanNeighbors[y]], P[zCanNeighbors[w]]]));
			}

		}

	}

	//console.log(E_CAN);
}


function BHS2017(P, addIncidentStop=false){

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

  var edgeBisectorMap  = new Map();

  for(var i=0; i<L.length; i++){
  	var p = L[i][0];
  	var q = L[i][1];


  	edgeBisectorMap.set( makeEdgePair(p, q), bisectorLength( P, p, q))
  }

  //console.log(edgeBisectorMap);

  // Sort the edges by their bisector length
  L.sort( function(l,r) {
    var p1 = l[0],
        q1 = l[1],
        p2 = r[0],
        q2 = r[1];
    return ( edgeBisectorMap.get(makeEdgePair(p1,q1)) - edgeBisectorMap.get(makeEdgePair(p2,q2)));
  });

  console.log(L);



  var E_A = [];
  var E_ACone = new Map();

  addIncident(P, L, E_A, E_ACone);

  console.log(E_A);

  var E_CAN = [];

  if(!addIncidentStop){
	  for(var i=0; i<E_A.length; i++){

	  	var p = E_A[i][0];
	  	var r = E_A[i][1];

			eventQueue.push(new GraphEvent("line", "highlight", [P[p], P[r]], 0));
	  	addCanonical(p, r, E_CAN, E_ACone, edgeBisectorMap, P, DT);
	  	addCanonical(r, p, E_CAN, E_ACone, edgeBisectorMap, P, DT);
	  }

	  console.log(E_CAN);
	}

	var G = new Map();

  for(var i=0; i<E_A.length; i++){
  	var p = E_A[i][0];
  	var q = E_A[i][1];

	  	if(!G.has(p)){
	  		G.set(p, []);
	  	}
	  	G.get(p).push(q);

	  	if(!G.has(q)){
	  		G.set(q, []);
	  	}
	  	G.get(q).push(p);
  }

  for(var i=0; i<E_CAN.length; i++){
  	var p = E_CAN[i][0];
  	var q = E_CAN[i][1];

  	if(!G.get(p).includes(q)){

	  	if(!G.has(p)){
	  		G.set(p, []);
	  	}
	  	G.get(p).push(q);

	  	if(!G.has(q)){
	  		G.set(q, []);
	  	}
	  	G.get(q).push(p);
	  }
  }

  console.log(G);
  return G;
}
