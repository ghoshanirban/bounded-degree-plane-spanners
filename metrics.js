/**
 *  Contains all of the measuring functions.
 */

function getMetrics(pointSet, graph, isDT){

  if(typeof graph == undefined){
    //console.log("EMPTY GRAPH");
    return;
  }

  if(isDT){
    graph = DTTOAL(graph);
  }

  var N = pointSet.length;
  var size = getNumEdges ( graph );
  var max_degree = maxDegree(graph);
  var avg_degree = avgDegree(graph).toFixed(3);
  var t = stretchFactor( pointSet, graph);
  var wt = getWeight(pointSet, graph).toFixed(3);
  var wt_mst = weightToMSTRatio( pointSet, graph, false, compDT=true).toFixed(3);

  return {
    N:N,
    size:size,
    max_degree:max_degree,
    avg_degree:avg_degree,
    stretchFactor:t,
    weight:wt,
    wtToMST: wt_mst
  };

}

function maxDegree( graph ){

  var max = 0;

  for(v of graph.keys()){

    var d = graph.get(v).length;

    if(d > max){
      max = d
    }
  }
  return max;
}


function avgDegree ( graph ){

  var sum = 0;

  for(v of graph.keys()){

    sum += graph.get(v).length;

  }

  return sum/graph.size;

}


function getNumPoints ( pointSet ){
  return pointSet.length;
}

function getNumEdges ( graph ){

  var numEdges = new Map();

  for(e of graph.keys()){
    var n = graph.get(e);

    for(var i=0; i<n.length; i++){
      if(!numEdges.has(n[i]+"-"+e)){
        numEdges.set(e+"-"+n[i]);
      }
    }
  }

  return numEdges.size;
}

function getWeight (points, graph ){

  var wGraph = getEdgeWeights(points, graph);

  return getWeightWGraph( wGraph );

}

function getWeightWGraph( wGraph ){

  var weight = 0;

  for(e of wGraph.keys()){
    weight += wGraph.get(e)
  }

  return weight;
}


function weightToMSTRatio( points, graph, isDT, compDT){

  var MSTGraph = MST(points, graph, compDT);

  if(isDT){
    var weightG = getWeightDT(points, graph);
  }
  else{
    var weightG = getWeight(points, graph);
  }

  var weightMST =  getWeightWGraph(MSTGraph);

  ////console.log(weightG, weightMST);

  return weightG/weightMST;
}

class disjoinSet{

  constructor(nVertices){

    this.rank = [];
    this.parent = [];
    this.n = nVertices;
    this.makeSet();

  }

  makeSet(){

    for(var i=0; i<this.n; i++){
      this.parent[i] = i;
      this.rank[i] = 0;
    }
  }

  findSet(x){
    if(this.parent[x] != x){
      this.parent[x] = this.findSet(this.parent[x]);
    }

    return this.parent[x];
  }

  union(x, y){

    var xRoot = this.findSet(x);
    var yRoot = this.findSet(y);

    if(xRoot == yRoot)
      return;

    else if(this.rank[yRoot] < this.rank[xRoot]){
      this.parent[xRoot] = yRoot;
    }

    else if(this.rank[yRoot] < this.rank[xRoot]){
      this.parent[yRoot] = xRoot;
    }

    else{
      this.parent[yRoot] = xRoot;
      this.rank[xRoot] = this.rank[xRoot] + 1;
    }

  }

}

function MST( points, graph, compDT){
  var T = new Map();

  var dS = new disjoinSet(points.length);

  var EDT = getEdgeWeightsDT(points);

  var E = new Map();

  ////console.log(graph);

  if(!compDT){

    for(e of EDT.keys()){

      var verts = e.split(",");
      var v1 = parseInt(verts[0]);
      var v2 = parseInt(verts[1]);

      //console.log(v1,v2);

      if(graph.get(v1).includes(v2)){
        E.set(v1+","+v2, EDT.get(e));
      }
    }
  }
  else{
    E = EDT;
  }

  ////console.log(E);

  var eArray = [];

  for(pair of E.keys()){

    eArray.push([pair, E.get(pair)]);
  }

  eArray.sort(function(a,b){
    return a[1]-b[1];
  });

  for(var i=0; i<eArray.length; i++){

    var edgeName = eArray[i][0].split(",");

    var x = parseInt(edgeName[0]);
    var y = parseInt(edgeName[1]);

    if(dS.findSet(x) != dS.findSet(y)){
      T.set(eArray[i][0], eArray[i][1]);
      dS.union(x, y);
    }
    if(T.size == points.length-1)
      break;
  }

  return T;
}

function stretchFactor( pointSet, graph){

  //console.log(graph);

  var dis = floydWarshall(pointSet, graph);
  var worstPair = [0,1];

  var t_max = 0;
  for(var i=0; i<pointSet.length; i++){
    for(var j=i+1; j<pointSet.length; j++){
      var t = dis[i][j] / JXG.Math.Geometry.distance(pointSet[i], pointSet[j], 2);
      if( t > t_max ) {
        t_max = t;
        worstPair = [i,j];
      }

    }
  }

  // find shortest path between the points in worstPair
  // A*
  var open = [];
  var closed = [];
  var dist = new Array(pointSet.length).fill(Infinity);
  var parent = new Array(pointSet.length).fill(-1);

  open.push(worstPair[0]); // insert the start node
  dist[worstPair[0]] = 0;
  var current;

  while( open.length > 0 && current != worstPair[1] ) {
    // sort the open array
    open.sort(function(b,a){
      return dist[b]+distance(pointSet[b],pointSet[worstPair[1]])
       - (dist[a]+distance(pointSet[a],pointSet[worstPair[1]]));
    });
    current = open.shift();
    closed.push(current);

    for( var i=0; i<graph.get(current).length; i++ ) {
      var neighbor = graph.get(current)[i];
      if(!closed.includes(neighbor)) {
        var g = dist[current]+distance(pointSet[neighbor],pointSet[current]);
        if( g < dist[neighbor]) {
          if( !open.includes() )
            open.push(neighbor);
          parent[neighbor] = current;
          dist[neighbor] = g;
        }
      }
    }
  }
  var path = [current]; // current is the goal vertex
  while(current != worstPair[0]) {
    current = parent[current];
    path.unshift(current);
  }

  return {t:t_max, pair:worstPair, path:path};
}
