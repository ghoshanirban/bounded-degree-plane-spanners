/**
 *  Implements the planar spanning graph algorithm presented in BGS2005.
 */

//All graphs utilized by the algorithm steps.
var delaunayTriangulation = [];
var splitVertecies = [];
var splitVerteciesIndex = new Map();
var polygonSpanner = new Map();
var vertexStatus = new Map();

//Delaunator Delaunay triangulation.
var delaunay = null;

//Verifies steps completion.
var stepCompletion = [false,false,false,false];

//Representation of a vertex for a simple polygon.
class splitVertex {
	constructor(point, S1){
		this.point = point;
		this.S1 = S1;
	}
}

// remove split vertices from the board
function removeSplitsFromBoard(){
  ////console.log(board.objects);
	for(var el in board.objects){
		if(board.objects[el].visProp.color == "green" || board.objects[el].visProp.color == "blue" || board.objects[el].visProp.color == "yellow"){
			board.removeObject(board.objects[el]);
		}
	}
}

//Checks if a given point has an incident chord, used in spanning graph step.
function hasIncidentChords(vertex, convexHull){
	var chordCounter = 0;

	for(var i=0; i<vertex.length; i++){
		if(convexHull.includes(vertex[i]))
			chordCounter += 1;
	}

	if(chordCounter >= 3)
		return true;
	else
		return false;
}

function BGS2005_2( P ){
	if(stepCompletion[4] == true)
		return;

	if(stepCompletion[3] == false)
		transformPolygon();

	for(var sPoint of polygon.keys()){
		var originalPoint = splitVertecies[sPoint].point;
		var originalPoints = new Map();
		var originalPointsArr = [];
		var sortedSplits = [];

		for(var i=0; i<polygon.get(sPoint).length; i++){
			////console.log(polygon.get(sPoint)[i]);
			////console.log(splitVertecies);
			////console.log(sPoint);

			if(polygon.get(sPoint)[i] == splitVertecies[sPoint].S1){
				sortedSplits.push(polygon.get(sPoint)[i]);
			}
			else{
				originalPoints.set(splitVertecies[polygon.get(sPoint)[i]].point, polygon.get(sPoint)[i])
				originalPointsArr.push(splitVertecies[polygon.get(sPoint)[i]].point)
			}
		}


		var sortedNeighbors = sortNeighbors(originalPoint, originalPointsArr);

		////console.log(sortedNeighbors);
		////console.log(originalPoints);
		////console.log(delaunayTriangulation);

		var s2;

		for(var i=0; i<delaunayTriangulation[originalPoint].length; i++){
			if(delaunayTriangulation[originalPoint][i] == splitVertecies[sortedSplits[0]].point){
				s2 = delaunayTriangulation[originalPoint][(i+1)%delaunayTriangulation[originalPoint].length];
				break;
			}
		}

		////console.log(originalPoints.get(s2));

		var startPoint = sortedNeighbors.indexOf(s2);

		////console.log(startPoint);

		for(var i=startPoint; i<sortedNeighbors.length+startPoint; i++){
			sortedSplits.push(originalPoints.get(sortedNeighbors[i%sortedNeighbors.length]));
		}

		////console.log(sortedSplits);

		polygon.set(sPoint,sortedSplits);

	}

	////console.log(polygon);

	//Maps vertex key to status (0 = unknown (not found), 1 = known (found not processed), 2 = complete (processed))
	var unknown = 0;
	var known = 1;
	var complete = 2;

	var splitVerteciesMap = new Map();

	var bfsQueue = [];

	////console.log(polygon);
	////console.log(splitVertecies);

	/*for(var i=0; i<splitVertecies.length; i++){
		splitVerteciesMap.set(i, splitVertecies[i]);
	}*/

	////console.log(splitVerteciesMap);

	var vI = 0;
	bfsQueue.push(vI);

	do{
		//console.log(polygonSpanner);
		vI = bfsQueue.shift();

		//console.log(vI);

		//Process the vertex.
		var sM = polygon.get(vI)[polygon.get(vI).length-1];
    var newEdges = [];

		if(vI == 0){
			newEdges = newEdges.concat( addPolygonSpanner(splitVertecies[vI].S1, vI, sM));
		}
		else{
			var sJ = polygonSpanner.get(vI)[0];
			var sK = polygonSpanner.get(vI)[polygonSpanner.get(vI).length-1];

			newEdges = newEdges.concat( addPolygonSpanner(splitVertecies[vI].S1, vI, sJ));
			newEdges = newEdges.concat( addPolygonSpanner(sK,vI,sM) );
		}

		if(!polygonSpanner.has(vI))
			polygonSpanner.set(vI, []);

		if(polygonSpanner.get(vI).length > 5){
			//console.log("Degree error")
		}

		if(!polygonSpanner.has(polygon.get(vI)[0])){
			polygonSpanner.set(polygon.get(vI)[0], []);
		}

		if(!polygonSpanner.has(polygon.get(vI)[polygon.get(vI).length-1])){
			polygonSpanner.set(polygon.get(vI)[polygon.get(vI).length-1], []);
		}

		//Add spanning graph edges (s1,sm)
		polygonSpanner.get(vI).push(polygon.get(vI)[0]);
		polygonSpanner.get(vI).push(polygon.get(vI)[polygon.get(vI).length-1]);

		polygonSpanner.get(polygon.get(vI)[0]).push(vI);
		polygonSpanner.get(polygon.get(vI)[polygon.get(vI).length-1]).push(vI);

		//console.log(newEdges);
		for(var i=0; i<newEdges.length; i++){
			if(newEdges[i] != null && vertexStatus.get(newEdges[i]) != complete){
				//console.log(vI, newEdges[i]);
				polygonSpanner.get(vI).push(newEdges[i]);
				if(!polygonSpanner.has(newEdges[i]))
					polygonSpanner.set(newEdges[i], []);
				polygonSpanner.get(newEdges[i]).push(vI);
			}
		}

		for(var i=0; i<polygon.get(vI).length; i++){
			var vN = polygon.get(vI)[i]

			if(!vertexStatus.has(vN)){
				bfsQueue.push(vN);
				vertexStatus.set(vN, known);
			}
		}

		vertexStatus.set(vI, complete);

		////console.log(vI);
		////console.log(bfsQueue);
		////console.log(vertexStatus);



	}while(bfsQueue.length > 0);

	//console.log(polygon);
	//console.log(polygonSpanner);

	for(var sPoint of polygonSpanner.keys()){
		var unSplit = splitVertecies[sPoint].point;
		if(!spanner.has(unSplit))
			spanner.set(unSplit, []);
		for(var i=0; i<polygonSpanner.get(sPoint).length; i++){
			if(!spanner.get(unSplit).includes(splitVertecies[polygonSpanner.get(sPoint)[i]].point))
			spanner.get(unSplit).push(splitVertecies[polygonSpanner.get(sPoint)[i]].point);
		}


	}

	drawGraph(spanner);

	//console.log(spanner);

	stepCompletion[4] = true;

  return spanner;
}

//Creates a spanning graph and displays on the board.
function spanningGraph(P,DT){
  //
	var spanningGraphG = new Map();
  var outerFace = [];
  var processingQueue = [];
  var canonicalOrder = [];
  var complete = [];
  var numVertices = P.length;

  for(var i=0; i<delaunay.hull.length; i++){
    outerFace.push(delaunay.hull[i]);
    processingQueue.push(delaunay.hull[i]);
  }

  canonicalOrder[0] = processingQueue.pop();
  canonicalOrder[1] = processingQueue.pop();

  var vK;

  while(processingQueue.length > 0){
    vK = processingQueue.shift();

    if(hasIncidentChords(DT[vK], outerFace))
      processingQueue.push(vK);
    else{
      --numVertices;

      canonicalOrder[numVertices] = vK;
      complete.push(vK);

      var spliceBound = outerFace.indexOf(vK);
      outerFace.splice(spliceBound, 1);

      for(var j=0; j<DT[vK].length; j++){
        if(!complete.includes(DT[vK][j]) && isFinite(DT[vK][j])){
          if(!outerFace.includes(DT[vK][j])){
            processingQueue.push(DT[vK][j]);
            outerFace.push(DT[vK][j]);
          }
        }
      }
    }
  }
	//console.log(delaunayTriangulation);

  //console.log(canonicalOrder);

  spanningGraphG = new Map();

  for(var i=0; i<3; i++){
		if(!spanningGraphG.has(canonicalOrder[i]) )
    	spanningGraphG.set(canonicalOrder[i], []);

		if(!spanningGraphG.has(canonicalOrder[(i+1)%3]) )
    	spanningGraphG.set(canonicalOrder[(i+1)%3], []);

    spanningGraphG.get(canonicalOrder[i]).push(canonicalOrder[(i+1)%3]);
    spanningGraphG.get(canonicalOrder[(i+1)%3]).push(canonicalOrder[i]);

    //console.log(canonicalOrder[i]);
  }

  for(var i=3; i<canonicalOrder.length; i++){
		//console.log(canonicalOrder[i]);
    var k_dt = DT[canonicalOrder[i]].length;

    var validNeighbors = [];
    var validV;


		var firstInvalid;
    for( firstInvalid = 0; firstInvalid<k_dt; firstInvalid++){
			//console.log(DT[canonicalOrder[i]][firstInvalid]);
      if(!spanningGraphG.has(DT[canonicalOrder[i]][firstInvalid])
			|| !isFinite(DT[canonicalOrder[i]][firstInvalid])){
        break;
      }
    }
		firstInvalid = firstInvalid % k_dt;
		//console.log(DT[canonicalOrder[i]][firstInvalid]);
		var firstValid;
    for( firstValid=firstInvalid; firstValid<k_dt+firstInvalid; firstValid++){
		//console.log(DT[canonicalOrder[i]][firstValid]);

      if(spanningGraphG.has(DT[canonicalOrder[i]][firstValid%k_dt])){
        break;
      }
    }
		firstValid = firstValid % k_dt;
		//console.log(DT[canonicalOrder[i]][firstValid]);
    for(var j=firstValid; j<k_dt+firstValid; j++){			//console.log(DT[canonicalOrder[i]][j%k_dt]);

      if(!spanningGraphG.has(DT[canonicalOrder[i]][j%k_dt])
			|| !isFinite(DT[canonicalOrder[i]][j%k_dt])){
        break;
      }
      ////console.log(delaunayTriangulation[i][j%N]);
      validNeighbors.push(DT[canonicalOrder[i]][j%k_dt]);
    }

    //console.log(validNeighbors);
		// if(canonicalOrder[i] == 15) {
		// 	//console.log(spanningGraphG.get(canonicalOrder[i]));
		// 	break;
		// }

    spanningGraphG.set(canonicalOrder[i], []);

    if(validNeighbors.length == 2){
      spanningGraphG.get(validNeighbors[0]).splice(spanningGraphG.get(validNeighbors[0]).indexOf(validNeighbors[1]),1);
      spanningGraphG.get(validNeighbors[1]).splice(spanningGraphG.get(validNeighbors[1]).indexOf(validNeighbors[0]),1);

      spanningGraphG.get(canonicalOrder[i]).push(validNeighbors[0]);
      spanningGraphG.get(canonicalOrder[i]).push(validNeighbors[1]);
      spanningGraphG.get(validNeighbors[0]).push(canonicalOrder[i]);
      spanningGraphG.get(validNeighbors[1]).push(canonicalOrder[i]);
    }

    else if(validNeighbors.length > 2){

      spanningGraphG.get(validNeighbors[0]).splice(spanningGraphG.get(validNeighbors[0]).indexOf(validNeighbors[1]),1);
      spanningGraphG.get(validNeighbors[1]).splice(spanningGraphG.get(validNeighbors[1]).indexOf(validNeighbors[0]),1);

      spanningGraphG.get(validNeighbors[validNeighbors.length-2]).splice(spanningGraphG.get(validNeighbors[validNeighbors.length-2]).indexOf(validNeighbors[validNeighbors.length-1]),1);
      spanningGraphG.get(validNeighbors[validNeighbors.length-1]).splice(spanningGraphG.get(validNeighbors[validNeighbors.length-1]).indexOf(validNeighbors[validNeighbors.length-2]),1);

      spanningGraphG.get(canonicalOrder[i]).push(validNeighbors[0]);
      spanningGraphG.get(canonicalOrder[i]).push(validNeighbors[1]);
      spanningGraphG.get(canonicalOrder[i]).push(validNeighbors[validNeighbors.length-1]);
      spanningGraphG.get(validNeighbors[0]).push(canonicalOrder[i]);
      spanningGraphG.get(validNeighbors[1]).push(canonicalOrder[i]);
      spanningGraphG.get(validNeighbors[validNeighbors.length-1]).push(canonicalOrder[i]);
    }
  }

  //var temp = delaunayTriangulation

  //delaunayTriangulation = spanningGraphG;

  //drawGraph(spanningGraphG);

  //delaunayTriangulation = temp;

  for(point in spanningGraphG.keys()){
    if(spanningGraphG.get(point).length > 3){
      //console.log("Degree Error");
      return;
    }
  }

  //stepCompletion[1] = true;
	return spanningGraphG;
}

function findS1Handle(DT,u,v,unsplitU){

  var vIndex;

  for(var i=0; i<DT[u].length; i++){//Finds index of v.

    if(DT[u][i] == v){
      vIndex = i;
      break;
    }
  }

  ////console.log(u);
  ////console.log(v);
  ////console.log(unsplitU);
  ////console.log(vIndex);
  for(var i=vIndex+DT[u].length; i>vIndex; i--){
    if (typeof unsplitU !== 'undefined'){
      if(unsplitU.has(DT[u][i%DT[u].length])){
        ////console.log(DT[u][i%DT[u].length])
        return DT[u][i%DT[u].length];
      }
    }
  }
}

function transformPolygon(P, DT, spanningGraphG){

  ////console.log(delaunay.hull);

	var polygon = new Map();


  var s1Initial = delaunay.hull[1];
  var v1Initial = delaunay.hull[0];

  var s1 = new splitVertex(s1Initial, null);

  var v1 = new splitVertex(v1Initial, null);

  splitVertecies.push(v1);

  splitVerteciesIndex.set(v1.point, new Map());
  splitVerteciesIndex.get(v1.point).set(s1.point, splitVertecies.indexOf(v1));

  var vNext = v1;
  var vI = v1;

  do{
    //console.log(vI.point);

    var N = DT[vI.point];
		var N_SG = spanningGraphG.get(vI.point);

    //console.log(N);

    var vITemp;
		var i,j;
    for(i=0; i<N.length; i++){
      if(N[i] ==  s1.point){
        i = (i+1)%N.length;
        break;
      }
    }

		for(j=i; j<N.length+i; j++ ) {
			if(N_SG.includes(N[j%N.length])) {
				break;
			}
		}
    s1 = vI;
    vNext = new splitVertex(N[j%N.length], splitVertecies.indexOf(s1));

    if(vNext.point == v1.point && splitVertecies[vNext.S1].point == s1Initial){
      vI = vNext;
      splitVertecies[0].S1 = vI.S1;

      polygon.get(0).push(vI.S1);
      polygon.get(vI.S1).push(0)

      break;
    } else {
      vI = vNext;
      splitVertecies.push(vI);
      if(!splitVerteciesIndex.has(vI.point)){
        splitVerteciesIndex.set(vI.point, new Map());
      }
      splitVerteciesIndex.get(vI.point).set(s1.point, splitVertecies.indexOf(vI));
    }

    polygon.set(splitVertecies.indexOf(vI), []);
    polygon.get(splitVertecies.indexOf(vI)).push(vI.S1);

    if(!polygon.has(vI.S1)){
      polygon.set(vI.S1, []);
    }
    polygon.get(vI.S1).push(splitVertecies.indexOf(vI));

    ////console.log(vNext.point, v1.point )
    ////console.log(splitVertecies[vNext.S1].point, s1Initial);

  }while(vNext.point != v1.point || splitVertecies[vNext.S1].point != s1Initial);

  var duplicatedPoints = [];
  var twoDuplicatedPoints = [];

  for(var i=0; i<splitVertecies.length; i++){

    if(twoDuplicatedPoints.includes(P[splitVertecies[i].point])){
      boardPointSet.push(board.create("point", P[splitVertecies[i].point], {
      size: 2,
      withLabel: true,
      color: "yellow",
      fixed: true,
      withLabel: false,
      }));
    }

    else if(duplicatedPoints.includes(P[splitVertecies[i].point])){
      boardPointSet.push(board.create("point", P[splitVertecies[i].point], {
      size: 6,
      withLabel: true,
      color: "green",
      fixed: true,
      withLabel: false,
      }));
      twoDuplicatedPoints.push(P[splitVertecies[i].point]);
    }
    else{
      boardPointSet.push(board.create("point", P[splitVertecies[i].point], {
        size: 10,
        withLabel: true,
        color: "blue",
        fixed: true,
        withLabel: false,
      }));
      duplicatedPoints.push(P[splitVertecies[i].point]);
    }
  }

  ////console.log(splitVertecies);
  //console.log(splitVerteciesIndex);
  ////console.log(polygon);
  ////console.log(delaunayTriangulation);
  ////console.log(spanningGraphG);

  ////console.log(boardEdges);

  for(var i=0; i<DT.length; i++){//Loops all points in DT

    for(var j=0; j<DT[i].length; j++){//All neighbors of a given point in DT
      if(!spanningGraphG.get(i).includes(DT[i][j]) && isFinite(DT[i][j])){
        var unsplitI = splitVerteciesIndex.get(i);
        var unsplitJ = splitVerteciesIndex.get(DT[i][j]);
        //console.log("I",i,unsplitI);
        //console.log("j",DT[i][j],unsplitJ);

        var s1I = findS1Handle(DT,i,DT[i][j], unsplitI);
        //splitVerteciesIndex.get(i).get(s1I);
        var s1J = findS1Handle(DT,DT[i][j], i, unsplitJ);

        ////console.log(i, s1I);
        //console.log(splitVerteciesIndex.get(i).get(s1I));


        polygon.get(splitVerteciesIndex.get(i).get(s1I)).push(splitVerteciesIndex.get(DT[i][j]).get(s1J));
      }
    }
  }
	return polygon;
}

function addPolygonSpanner(P,polygon,s1, vI, sM){

  ////console.log(splitVertecies[sM].point, splitVertecies[vI].point, splitVertecies[s1].point );

  var alpha  = JXG.Math.Geometry.rad(P[splitVertecies[sM].point], P[splitVertecies[vI].point], P[splitVertecies[s1].point] );

  if(splitVertecies[sM].point == splitVertecies[s1].point){
    alpha = 2*PI;
  }

  ////console.log(alpha);

  var subAngles = Math.ceil((alpha)/(PI/2));

  ////console.log(subAngles);

  var beta = alpha/subAngles;

  ////console.log(beta);

  var add = [];

  for(var i=0; i<subAngles; i++){
    add.push(null);
  }

  var index;

  var theta;

  for(var j=1; j<polygon.get(vI).length-1; j++){

    ////console.log(splitVertecies[polygon.get(vI)[j]].point ,splitVertecies[vI].point ,splitVertecies[s1].point);

    theta = JXG.Math.Geometry.rad(P[splitVertecies[polygon.get(vI)[j]].point] ,P[splitVertecies[vI].point] ,P[splitVertecies[s1].point]);

    ////console.log(theta);

    index = Math.trunc(theta/beta);

    ////console.log(index);

    if(add[index] == null || (JXG.Math.Geometry.distance(P[splitVertecies[polygon.get(vI)[j]].point] ,P[splitVertecies[vI].point], 2) < JXG.Math.Geometry.distance(P[splitVertecies[add[index]].point] ,P[splitVertecies[vI].point], 2))){
      add[index] = polygon.get(vI)[j]
    }

  }


  ////console.log(add);

  return add;

  //Add the non nulls as an edge with VI to polygonSpanner.



}

function BGS2005(P){
	var DT = createDelaunayTriangulation(P);
	var SG = spanningGraph(P,DT),
  	polygon = transformPolygon(P,DT,SG);

	var spanner  = new Map();

  for(var sPoint of polygon.keys()){
    var originalPoint = splitVertecies[sPoint].point;
    var originalPoints = new Map();
    var originalPointsArr = [];
    var sortedSplits = [];

    for(var i=0; i<polygon.get(sPoint).length; i++){
      ////console.log(polygon.get(sPoint)[i]);
      ////console.log(splitVertecies);
      ////console.log(sPoint);

      if(polygon.get(sPoint)[i] == splitVertecies[sPoint].S1){
        sortedSplits.push(polygon.get(sPoint)[i]);
      }
      else{
        originalPoints.set(splitVertecies[polygon.get(sPoint)[i]].point, polygon.get(sPoint)[i])
        originalPointsArr.push(splitVertecies[polygon.get(sPoint)[i]].point)
      }
    }


    var sortedNeighbors = originalPointsArr;

    ////console.log(sortedNeighbors);
    ////console.log(originalPoints);
    ////console.log(delaunayTriangulation);

    var s2;

    for(var i=0; i<DT[originalPoint].length; i++){
      if(DT[originalPoint][i] == splitVertecies[sortedSplits[0]].point){
        s2 = DT[originalPoint][(i+1)%DT[originalPoint].length];
        break;
      }
    }

    ////console.log(originalPoints.get(s2));

    var startPoint = sortedNeighbors.indexOf(s2);

    ////console.log(startPoint);

    for(var i=startPoint; i<sortedNeighbors.length+startPoint; i++){
      sortedSplits.push(originalPoints.get(sortedNeighbors[i%sortedNeighbors.length]));
    }

    ////console.log(sortedSplits);

    polygon.set(sPoint,sortedSplits);

  }

  ////console.log(polygon);

  //Maps vertex key to status (0 = unknown (not found), 1 = known (found not processed), 2 = complete (processed))
  var unknown = 0;
  var known = 1;
  var complete = 2;

  var splitVerteciesMap = new Map();

  var bfsQueue = [];

  ////console.log(polygon);
  ////console.log(splitVertecies);

  /*for(var i=0; i<splitVertecies.length; i++){
    splitVerteciesMap.set(i, splitVertecies[i]);
  }*/

  ////console.log(splitVerteciesMap);

  var vI = 0;


  bfsQueue.push(vI);
  vertexStatus.set(vI, known);



  do{
    ////console.log(polygonSpanner);
    vI = bfsQueue.shift();

    if(vI != 0){
      while(!polygonSpanner.has(vI)){
        bfsQueue.push(vI);
        vI = bfsQueue.shift();
      }
    }

    ////console.log(vI);
    ////console.log(vertexStatus.get(vI));

    //Process the vertex.
    var sM = polygon.get(vI)[polygon.get(vI).length-1];

    if(vI == 0){
      var newEdges = addPolygonSpanner(P,polygon,splitVertecies[vI].S1, vI, sM);
    }
    else{

      var sJ = polygonSpanner.get(vI)[0];
      var sK = polygonSpanner.get(vI)[polygonSpanner.get(vI).length-1];


      var newEdges = addPolygonSpanner(P,polygon,splitVertecies[vI].S1, vI, sJ);
      var newEdges2 = addPolygonSpanner(P,polygon,sK,vI,sM);

      for(var i=0; i<newEdges2.length; i++){
        newEdges.push(newEdges2[i]);
      }
    }

    var newEdgesV = [];
    for(var i=0; i<newEdges.length; i++){
      if(!isNaN(newEdges[i]) && newEdges[i] != null  && !newEdgesV.includes(newEdges[i])){
        newEdgesV.push(newEdges[i]);
      }
    }


    if(!polygonSpanner.has(vI)){
      polygonSpanner.set(vI, []);
      ////console.log(vI);
    }

    if(polygonSpanner.get(vI).length > 5){
      //console.log("Degree error")
    }

    if(!polygonSpanner.has(polygon.get(vI)[0])){
      polygonSpanner.set(polygon.get(vI)[0], []);
      ////console.log(polygon.get(vI)[0]);
    }

    if(!polygonSpanner.has(polygon.get(vI)[polygon.get(vI).length-1])){
      polygonSpanner.set(polygon.get(vI)[polygon.get(vI).length-1], []);
      ////console.log(polygon.get(vI)[polygon.get(vI).length-1]);
    }

    ////console.log(polygonSpanner);

    //Add spanning graph edges (s1,sm)
    if(!polygonSpanner.get(vI).includes(polygon.get(vI)[0]))
      polygonSpanner.get(vI).push(polygon.get(vI)[0]);
    if(!polygonSpanner.get(vI).includes(polygon.get(vI)[polygon.get(vI).length-1]))
      polygonSpanner.get(vI).push(polygon.get(vI)[polygon.get(vI).length-1]);

    if(!polygonSpanner.get(polygon.get(vI)[0]).includes(vI))
      polygonSpanner.get(polygon.get(vI)[0]).push(vI);
    if(!polygonSpanner.get(polygon.get(vI)[polygon.get(vI).length-1]).includes(vI))
      polygonSpanner.get(polygon.get(vI)[polygon.get(vI).length-1]).push(vI);

    ////console.log(newEdgesV);
    for(var i=0; i<newEdgesV.length; i++){
      if(newEdgesV[i] != null && vertexStatus.get(newEdgesV[i]) != complete){
        ////console.log(vI, newEdgesV[i]);
        if(!polygonSpanner.get(vI).includes(newEdgesV[i]))
          polygonSpanner.get(vI).push(newEdgesV[i]);
        if(!polygonSpanner.has(newEdgesV[i]))
          polygonSpanner.set(newEdgesV[i], [])
        polygonSpanner.get(newEdgesV[i]).push(vI);
      }
    }

    for(var i=0; i<polygon.get(vI).length; i++){
      var vN = polygon.get(vI)[i]
      ////console.log("VI",vI,"VN",vN);
      if(!vertexStatus.has(vN)){
        bfsQueue.push(vN);
        vertexStatus.set(vN, known);
      }
    }
    vertexStatus.set(vI, complete);

    ////console.log(vI);
    ////console.log(bfsQueue);
    ////console.log(vertexStatus);

  }while(bfsQueue.length > 0);

  ////console.log(polygon);
  //console.log(polygonSpanner);

  for(var sPoint of polygonSpanner.keys()){
    var unSplit = splitVertecies[sPoint].point;
    if(!spanner.has(unSplit))
      spanner.set(unSplit, []);
    for(var i=0; i<polygonSpanner.get(sPoint).length; i++){
      if(!spanner.get(unSplit).includes(splitVertecies[polygonSpanner.get(sPoint)[i]].point))
      spanner.get(unSplit).push(splitVertecies[polygonSpanner.get(sPoint)[i]].point);
    }
  }

  for(sPoint of spanner.keys()){
    if(spanner.get(sPoint).length > 27){
      //console.log("Degree error");
    }
  }

  removeSplitsFromBoard();

  //console.log(spanner);
	return spanner;
}
