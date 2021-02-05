/**
 *  Contains all the functions and data required for interaction with the
 *  JSXGraph board.
 */

var showLabels = true;
var pointsEditable = false;

var board = JXG.JSXGraph.initBoard('jxgbox', boardParams);
var navBar = document.getElementById("jxgbox_navigationbar");

window.addEventListener( 'resize', setNewBoundingBox );

//Holds a board infinte vertex object.
var boardInfiniteVertex = null;

//Holds the board edge objects that connect to the infinite vertex.
var boardInfiniteEdges = [];

//Holds all the board edge objects of the delaunay triangulation.
var boardEdgesDT = new Map();

//Holds all the board edge objects.
var boardEdges = new Map();

//Holds the board point objects.
var boardPointSet = [];

//Clears the JSX board and resets all variables.
function clearBoard(){
  // JSXGraph stuff
  JXG.JSXGraph.freeBoard(board);
  board = JXG.JSXGraph.initBoard("jxgbox",boardParams);
  navBar = document.getElementById("jxgbox_navigationbar");
  board.on('down', boardClick);
  boardPointSet = [];
  boardInfiniteVertex = null;
  //clearBoardEdges();
  boardInfiniteEdges = [];
  boardEdges.clear();

  // Algorithm stuff
  delaunayTriangulation = [];
  splitVertecies = [];
  splitVerteciesIndex.clear();
  vertexStatus.clear();
  polygonSpanner.clear();
  delaunay = null;
  stepCompletion = [false,false,false,false];

  //Clear event queue
  clearEventQueue();

  algorithmResults.innerHTML = "&nbsp;";
}

function setNewBoundingBox() {
  // determine bounding box: [min, max]
  if( pointSet.length > 5 ) {
    pointSetBoundingBox = [
      pointSet[0][0],pointSet[0][1],
      pointSet[0][0],pointSet[0][1]
    ];
    //min x, max y, max x, min y
    for( var i=0; i<pointSet.length; i++ ) {
      // upper left corner
      pointSetBoundingBox[0] = Math.min( pointSetBoundingBox[0], pointSet[i][0] );
      pointSetBoundingBox[1] = Math.max( pointSetBoundingBox[1], pointSet[i][1] );
      // lower right corner
      pointSetBoundingBox[2] = Math.max( pointSetBoundingBox[2], pointSet[i][0] );
      pointSetBoundingBox[3] = Math.min( pointSetBoundingBox[3], pointSet[i][1] );
    }

    var boxSize = [
      Math.abs( pointSetBoundingBox[0]-pointSetBoundingBox[2] ),
      Math.abs( pointSetBoundingBox[1]-pointSetBoundingBox[3] )
    ];
    var padding = 0.05 * Math.max(
      boxSize[0], boxSize[1]
    );
    var diff = [
      board.containerObj.clientWidth / boxSize[0],
      board.containerObj.clientHeight / boxSize[1]
    ];
    var unit = [
      board.containerObj.clientWidth / (boxSize[0] + 2*padding),
      board.containerObj.clientHeight / (boxSize[1] + 2*padding),
    ];

    var xDiffIsLarger = diff[0] > diff[1];
    var diffPadding = [
      Number( xDiffIsLarger) * (board.containerObj.clientWidth/unit[1] - boxSize[0] - 2*padding)/2,
      Number(!xDiffIsLarger) * (board.containerObj.clientHeight/unit[0] - boxSize[1] - 2*padding)/2
    ];
    // keep separate (instead of looping) to individually manipulate
    pointSetBoundingBox[0] -= (padding + diffPadding[0]); // from left edge
    pointSetBoundingBox[1] += (padding + diffPadding[1]); // from top
    pointSetBoundingBox[2] += (padding + diffPadding[0]); // from right
    pointSetBoundingBox[3] -= (padding + diffPadding[1]); // from bottom

    //board.resizeContainer( board.containerObj.clientWidth, board.containerObj.clientHeight );
    board.setBoundingBox(pointSetBoundingBox, true);
  }
}

//Redone!
//Given an adjacency list the coresponding graph is drawn to the board.
function drawGraph(aL){
  if( aL.length == 0 )
    return;

  boardEdges.clear();

  board.suspendUpdate();

  for(point of aL.keys()) {
    for(var i=0; i<aL.get(point).length; i++) {
      if(!boardEdges.has(aL.get(point)[i]+'-'+point)) {
        boardEdges.set(
          point+'-'+aL.get(point)[i],
          board.create("line",
            [boardPointSet[point],boardPointSet[aL.get(point)[i]]],
            activeEdgeStyle
          )
        );
      }
    }
  }

  board.unsuspendUpdate();
}


 // Draws a graph on the board made from 2d arrays
function drawArrayGraph( points, DT ){
  if(points.length == 0)
 		return;

  boardEdges.clear();

 	board.suspendUpdate();

 	//Create edges on board.
 	for(point in DT){
    if(isFinite(point)) {
   		for(var i=0; i<DT[point].length; i++){
   			if(isFinite(DT[point][i]) && !boardEdgesDT.has(String(DT[point][i])+'-'+point)) {
   				boardEdgesDT.set(
            point+'-'+String(DT[point][i]),
            board.create("line",
              [boardPointSet[point],boardPointSet[DT[point][i]]],
              inactiveEdgeStyle
            )
          );
        }
   		}
    }
 	}

 	board.unsuspendUpdate();
}

function drawPath(path) {
  board.suspendUpdate();

  // add colored points to path ends
  board.create("point", pointSet[path[0]], worstPathPointStyle);
  board.create("point", pointSet[path[path.length-1]], worstPathPointStyle);

  var current = 0;

  for( var i=1;i<path.length; i++) {
    board.create("line", [pointSet[path[i-1]], pointSet[path[i]]], worstPathEdgeStyle);
  }

  board.unsuspendUpdate();
}

//Adds an underlay of the original graph (delaunay triangilation).
function delaunayUnderlay(){
	board.suspendUpdate();

	for(var i=0; i<delaunay.triangles.length; i+=3){
		board.create("line", [boardPointSet[delaunay.triangles[i]],boardPointSet[delaunay.triangles[i+1]]], {
			strokeColor: '#808080',
			strokeOpacity: .5,
			strokeWidth: 1,
			straightFirst: false,
			straightLast: false,
			name: "delaunayEdge"+(i+1),
		});
		board.create("line", [boardPointSet[delaunay.triangles[i]],boardPointSet[delaunay.triangles[i+2]]], {
			strokeColor: '#808080',
			strokeOpacity: .5,
			strokeWidth: 1,
			straightFirst: false,
			straightLast: false,
			name: "delaunayEdge"+(i+2),
		});
		board.create("line", [boardPointSet[delaunay.triangles[i+1]],boardPointSet[delaunay.triangles[i+2]]], {
			strokeColor: '#808080',
			strokeOpacity: .5,
			strokeWidth: 1,
			straightFirst: false,
			straightLast: false,
			name: "delaunayEdge"+(i+3),
		});
	}
	board.unsuspendUpdate();
}

function getMouseCoords(e,i) {
  var cPos = board.getCoordsTopLeftCorner(e,i),
  absPos = JXG.getPosition(e,i),
  dx = absPos[0] - cPos[0],
  dy = absPos[1] - cPos[1];
  return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board);
}

function boardClick(e) {
  // see https://jsxgraph.uni-bayreuth.de/wiki/index.php/Browser_event_and_coordinates


  // if the click is on the navBar, return
  if(e.composedPath().includes(navBar))
    return;

  // if the board is locked, return
  if( !pointsEditable )
    return;

  var canCreate = true,
    i = e.which,
    coords = getMouseCoords(e, i),
    el;


  for (el in board.objects) {
    // if the point already exists
    if(JXG.isPoint(board.objects[el]) && board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
      switch(i) {
        case 1: // left click, quit without adding to the pointset
          return;
        case 3: // right click, remove point
          // copy pointSet and remove the point that was clicked
          var newPointSet = [];
          var clickedPoint = [
            board.objects[el].coords.usrCoords[1],
            board.objects[el].coords.usrCoords[2]];
          for( var j=0;j<pointSet.length;j++ ) {
            if( Math.abs(clickedPoint[0]-pointSet[j][0]) > EPSILON
            || Math.abs(clickedPoint[1]-pointSet[j][1]) > EPSILON) {
              newPointSet.push(pointSet[j]);
            }
          }
          // call resetButtonListener
          resetButtonListener();
          // call plotNewPoints on modified pointSet
          plotNewPoints(newPointSet);
          return;
      }
    }
  }
  if(i==1)
    plotNewPoints( [[coords.usrCoords[1],coords.usrCoords[2]]] );
}
