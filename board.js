/**
 *  Contains all the functions and data required for interaction with the
 *  JSXGraph board.
 */

var showLabels = true;
var pointsEditable = true;

JXG.Options.text.display = 'internal';
var board = JXG.JSXGraph.initBoard('jxgbox', boardParams);
var navBar = document.getElementById("jxgbox_navigationbar");

var delaunayEdgeCheckbox = document.getElementById("showDelaunayEdges");

var pngButton = document.getElementById('savePNG');
var svgButton = document.getElementById('saveSVG');

window.addEventListener( 'resize', setNewBoundingBox );

//Holds a board infinite vertex object.
var boardInfiniteVertex = null;

//Holds the board edge objects that connect to the infinite vertex.
var boardInfiniteEdges = [];

//Holds all the board edge objects of the Delaunay triangulation.
var boardEdgesDT = new Map();

//Holds all the board edge objects.
var boardEdges = new Map();

//Holds the board point objects.
var boardPointSet = [];

//Clears the JSX board and resets all variables.
function clearBoard(){
  // JSXGraph stuff
  JXG.JSXGraph.freeBoard(board);
  JXG.Options.text.display = 'internal';
  board = JXG.JSXGraph.initBoard("jxgbox",boardParams);
  navBar = document.getElementById("jxgbox_navigationbar");
  board.on('down', boardClick);
  boardPointSet = [];
  boardInfiniteVertex = null;
  //clearBoardEdges();
  boardInfiniteEdges = [];
  boardEdges.clear();
  boardEdgesDT.clear();

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
  if( pointSet.length > 1 ) {
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
/* Translate a point set given in P to the bounding box provided in boundingbox
 * as upper-left x, upper-left y, lower-right x, lower-right y.
 */
function translatePointSetToBoundingBox( P, targetBoundingBox = [-1, 1, 1, -1], padding = 0 ) {
  // determine bounding box: [min, max]
  if( P.length > 1 ) {
    let initialBoundingBox = [
      P[0][0],P[0][1],
      P[0][0],P[0][1]
    ];
    //min x, max y, max x, min y
    for( var i=0; i<P.length; i++ ) {
      // upper left corner
      initialBoundingBox[0] = Math.min( initialBoundingBox[0], P[i][0] );
      initialBoundingBox[1] = Math.max( initialBoundingBox[1], P[i][1] );
      // lower right corner
      initialBoundingBox[2] = Math.max( initialBoundingBox[2], P[i][0] );
      initialBoundingBox[3] = Math.min( initialBoundingBox[3], P[i][1] );
    }

    var initialBoxSize = [
      Math.abs( initialBoundingBox[0]-initialBoundingBox[2] ),
      Math.abs( initialBoundingBox[1]-initialBoundingBox[3] )
    ];

    var targetBoxSize = [
      Math.abs( targetBoundingBox[0]-targetBoundingBox[2] ),
      Math.abs( targetBoundingBox[1]-targetBoundingBox[3] )
    ];

    // Find the ratio of point set size to target size
    var diff = [];
    for( var i=0; i<initialBoxSize.length; i++ ) {
      diff.push( initialBoxSize[i]/targetBoxSize[i] );
    }
    // Let the max ratio determine what factor to remove from the coordinate
    var scalingDimension = 0;
    for( var i=1; i<targetBoxSize.length; i++ ) {
      if( diff[i] > diff[scalingDimension] ) {
        scalingDimension = i;
      }
    }

    var P_prime = [];
    // Normalize the points by first subtracting the min bounding box value of each
    // dimension and subtracting the
    for( var i=0; i<P.length; i++ ) {
      var normalizedPoint = [];
      // first, subtract the point set's min bounding box value for each dimension
      // and half the bounding box size
      // Then, dividing by the scaling dimension of the given point set
      // Then, multiply by the scaling dimension of the target
      // Then, add the target's min bounding box value and half the target size
      for( var j=0; j<P[i].length; j++ ) {
        normalizedPoint.push(
        ( P[i][j] - initialBoundingBox[j*3] - initialBoxSize[j]/2 )
          /
            initialBoxSize[scalingDimension]
          *
            targetBoxSize[scalingDimension]
          +
            targetBoundingBox[j*3] + targetBoxSize[j]/2
        );
      }
      P_prime.push( normalizedPoint );
    }
    return P_prime;
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

  boardEdgesDT.clear();

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

//Adds an underlay of the original graph (Delaunay triangulation).
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

  //console.log(e);
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
        case 1: // left click, quit without adding to the point set
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
          //resetButtonListener();
          // call plotNewPoints on modified pointSet
          pointSet = []
          pointSet = pointSet.concat(newPointSet);
          updatePointTextbox();
          var userPoints = parsePointTextbox(pointsTextbox.value);
          resetButtonListener();
          plotNewPoints(userPoints);
          return;
      }
    }
  }
  if(i==1){
    pointSet = pointSet.concat([[coords.usrCoords[1],coords.usrCoords[2]]]);
    updatePointTextbox();
    var userPoints = parsePointTextbox(pointsTextbox.value);
    resetButtonListener();
    plotNewPoints(userPoints);
  }
}

pngButton.addEventListener("click", savePNG)
function savePNG(){
  screenShot("png");
}

svgButton.addEventListener("click", saveSVG)
function saveSVG(){
  screenShot("svg");

}

delaunayEdgeCheckbox.addEventListener( "click", delaunayEdgeCheckboxListener)
function delaunayEdgeCheckboxListener(){
  console.log("called");
  if(boardEdges.size == 0)
    return;
  board.suspendUpdate();
  if(!delaunayEdgeCheckbox.checked){
    for(var key of boardEdgesDT.keys()) {
        var edge = boardEdgesDT.get(key);
        edge.hideElement();
      }
    }
  else{
    for(var key of boardEdgesDT.keys()) {
        var edge = boardEdgesDT.get(key);
        edge.showElement();
      }
    }
      //edge.setAttribute(delaunayEdgeCheckbox.checked ? 
        //{strokeColor: '#AAAAAA'} : {strokeColor: '#FFFFFF'});
  board.unsuspendUpdate();
  }




  /*if(!delaunayEdgeCheckbox.checked){
    //removeDelaunayEdges();
    hideDelaunayEdges();
  }
  else{
      boardEdgesDT.clear();
      var G_prime = createDelaunayTriangulation(pointSet);
      drawArrayGraph(pointSet,G_prime);
    }
  board.unsuspendUpdate();
};

function removeDelaunayEdges(){
  for(var key of boardEdgesDT.keys()) {
      var edge = boardEdgesDT.get(key);
      board.removeObject(edge);
    }
}*/

//Screen shot button to capture board image, saves the board as an SVG tree.
function screenShot(type){

  //Converts to SVG tag.
  var svg = board.renderer.svgRoot;

  var xml = new XMLSerializer().serializeToString(svg);

  var svg64 = btoa(xml);

   var b64start = 'data:image/svg+xml;base64,';

   var img = b64start + svg64;

   var imgT = document.getElementById('screenShotImg');

   imgT.setAttribute('src', img);
   imgT.setAttribute('width', svg.style.width);
   imgT.setAttribute('height', svg.style.height);

    //Saves svg tag to an svg file for viewing.
    var mySVG    = svg,     // Inline SVG element
      tgtImage = document.getElementById('screenShotImg'),      // Where to draw the result
      can      = document.createElement('canvas'), // Not shown on page
      ctx      = can.getContext('2d'),
      loader   = new Image;
    loader.width  = can.width  = tgtImage.width;
    loader.height = can.height = tgtImage.height;

    loader.onload = function(){
      ctx.drawImage( loader, 0, 0, loader.width, loader.height );
      ////console.log(can);
      setTimeout(function(){return}, 1000)
      tgtImage.src = can.toDataURL();
    };

    var svgAsXML = (new XMLSerializer).serializeToString( mySVG );
    loader.src = 'data:image/svg+xml,' + encodeURIComponent( svgAsXML );

    if(type == "svg"){

      setTimeout(function(){downloadScreenShot("img", xml, "svg")}, 1000);
    }
    else if (type == "png"){
      setTimeout(function(){downloadScreenShot("img", tgtImage.src, "png")}, 1000);
  }

}

//Creates a hidden link tag for automatic download upon screen shot.
function downloadScreenShot(filename, text, type) {

    var element = document.createElement('a');
    if(type == "svg"){
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    }

    else if(type == "png"){
      element.setAttribute('href', text);
    }

    else{
      return;
    }

    element.setAttribute('download', filename+"."+type);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
