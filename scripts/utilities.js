/**
 *  Contains all the helper functions that don't really fit into another file.
 */

 const PI = Math.PI;
 const EPSILON = 10e-7;



function makeEdgePair(v1, v2){
  var vA = Math.min(v1,v2);
  var vB = Math.max(v1,v2);

  return vA+"-"+vB;

}

function makeConePair(v1, cone){
  return v1+"-"+cone;
}

 //Redone!
 //Given a vertex and its neighbors, a clockwise ordering neighbors is returned.
 function sortNeighbors(points, ref, arr){
 	var angleArray = [];
 	var pointAnglePairs = new Map();

 	for(var i=0; i<arr.length; i++){
 		angleArray.push(JXG.Math.Geometry.rad(points[arr[i]], points[ref], points[arr[0]]));
 		pointAnglePairs.set(angleArray[i],arr[i]);
 	}
 	angleArray.sort();

 	var validArr = [];
 	for(var i=0; i<arr.length; i++){
 		validArr.push(pointAnglePairs.get(angleArray[i]));
 	}
 	return validArr;
 }

function createDelaunayTriangulation(points) {
  delaunay = Delaunator.from(points);

	//Convert delaunator to aL.
	var dt = convertDelaunator(points, delaunay);

  for(var i=0; i<dt.length; i++){
    dt[i] = sortNeighbors(points,i,dt[i]);
  }
  var lastV = delaunay.hull[delaunay.hull.length-1];
  // Add and order infinite vertices along convex hull
  for(var i=0; i<delaunay.hull.length; i++){
    for(var j=0; j<dt[delaunay.hull[i]].length; j++){
      if(dt[delaunay.hull[i]][j] == lastV){
        dt[delaunay.hull[i]].splice( (j+1)%dt[delaunay.hull[i]].length, 0, Infinity);
        break;
      }
    }
    lastV = delaunay.hull[i];
  }

  delaunayTriangulation = copy2D(dt);
  return dt;
}

function copy2D(array2d) {
  var copy = new Array(array2d.length);
  for(var i=0; i<array2d.length; i++) {
    copy[i] = array2d[i].slice();
  }
  return copy;
}

//Redone!
//Turns the delaunator object into an adjacency list.
function convertDelaunator( points, delaunay ){
  var delaunayTriangulation = [];
  for(var i=0; i<points.length; i++)
    delaunayTriangulation[i] = [];

  for(var i=0; i<delaunay.triangles.length; i+=3) {
    if(!delaunayTriangulation[delaunay.triangles[i]].includes(delaunay.triangles[i+1]))
      delaunayTriangulation[delaunay.triangles[i]].push(delaunay.triangles[i+1]);

    if(!delaunayTriangulation[delaunay.triangles[i]].includes(delaunay.triangles[i+2]))
      delaunayTriangulation[delaunay.triangles[i]].push(delaunay.triangles[i+2]);

    if(!delaunayTriangulation[delaunay.triangles[i+1]].includes(delaunay.triangles[i]))
      delaunayTriangulation[delaunay.triangles[i+1]].push(delaunay.triangles[i]);

    if(!delaunayTriangulation[delaunay.triangles[i+1]].includes(delaunay.triangles[i+2]))
      delaunayTriangulation[delaunay.triangles[i+1]].push(delaunay.triangles[i+2]);

    if(!delaunayTriangulation[delaunay.triangles[i+2]].includes(delaunay.triangles[i]))
      delaunayTriangulation[delaunay.triangles[i+2]].push(delaunay.triangles[i]);

   if(!delaunayTriangulation[delaunay.triangles[i+2]].includes(delaunay.triangles[i+1]))
    delaunayTriangulation[delaunay.triangles[i+2]].push(delaunay.triangles[i+1]);
  }

	//Order the neighbors
	for(var i=0; i<delaunayTriangulation.length; i++){
		delaunayTriangulation[i] = sortNeighbors(points,i,delaunayTriangulation[i]);
	}

  return delaunayTriangulation;
}

//Changes a DT Matrix into an adjacency list
function DTTOAL(DT){

  var DTAL = new Map();

  for(var i=0; i<DT.length;i++){
    DTAL.set(i, []);
    for(var j=0; j<DT[i].length;j++){
      if(!isFinite(DT[i][j]))
      {
        continue;
      }
      DTAL.get(i).push(DT[i][j])
    }
  }
  return DTAL
}

/**
 *  Returns the clockwise angle in radians from ab to bc.
 */
function angle(a,b,c) {
  return a==c ? 0 : JXG.Math.Geometry.rad(c,b,a);
}

/**
 *  Returns the distance from a to b while driving a Ferrari.
 */
function distance(a,b) {
  return a==b ? 0 : JXG.Math.Geometry.distance(a,b,2);
}

//Returns an edge set with all weights from the original delaunay triangulation.
function getEdgeWeightsDT( points ){

  var dT = createDelaunayTriangulation(points);

  var E = new Map();

  for(var i=0; i<dT.length; i++){

    for(var j=0; j<dT[i].length; j++){

      if(!E.has( dT[i][j] + "," + i  ) && isFinite(dT[i][j])){
        E.set( i + "," + dT[i][j] , distance(points[i], points[dT[i][j]]) );
      }
    }
  }

  return E;
}

function getEdgeWeights( points , graph ){

  var E = new Map();

  for(v of graph.keys()){

    for(var j=0; j<graph.get(v).length; j++){

      var x = graph.get(v)[j];


      if(!E.has( x + "," + v  ) && isFinite(x)){
        E.set( v + "," + x , distance(points[v], points[x]) );
      }
    }
  }

  return E;
}

function floydWarshall( pointSet, graph){
  var dis = [];

  for(var i=0; i<graph.size; i++){
    dis.push([]);
    for(var j=0; j<graph.size; j++){
      if(i == j){
        dis[i].push(0);
      }
      else if(graph.get(i).includes(j)){
        dis[i].push(JXG.Math.Geometry.distance(pointSet[i], pointSet[j], 2));
      }
      else{
        dis[i].push(Infinity);
      }
    }
  }

  for(var k=0; k<graph.size; k++){
    for(var i=0; i<graph.size; i++){
      for(var j=0; j<graph.size; j++){
        if(dis[i][j] > dis[i][k] + dis[k][j]){
          dis[i][j] = dis[i][k] + dis[k][j];
        }
      }
    }
  }
  ////console.log(dis);
  return dis;
}

function floydWarDT(pointSet, DT ){
  var dis = [];

  for(var i=0; i<DT.length; i++){
    for(var j=0; j<DT.length; j++){

      if(!isFinite(DT[i][j])){
        x = DT[i].splice(j,1);
      }
    }
  }

  //console.log(DT);

  for(var i=0; i<DT.length; i++){
    dis.push([]);
    for(var j=0; j<DT.length; j++){

      if(i == j){
        dis[i].push(0);
      }
      else if(DT[i].includes(j)){
        dis[i].push(JXG.Math.Geometry.distance(pointSet[i], pointSet[j], 2));
      }
      else{
        dis[i].push(Infinity);
      }
    }
  }

  //console.log(DT.length);

  for(var k=0; k<DT.length; k++){
    for(var i=0; i<DT.length; i++){
      for(var j=0; j<DT.length; j++){
        if(dis[i][j] > dis[i][k] + dis[k][j]){
          dis[i][j] = dis[i][k] + dis[k][j];
        }
      }
    }
  }

  ////console.log(dis);
  return dis;
}
