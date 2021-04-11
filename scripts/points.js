/**
 *  Contains all the functions and data required points and point sets.
 */

const POINT_LIMIT = 1000;

var pointSet = [],
  pointSetBoundingBox = [];

var randomButton = document.getElementById("genPlotPoints");
var pointsTextbox = document.getElementById("pointsInput");
var plotButton = document.getElementById("plotPoints");
var resetButton = document.getElementById("reset");
var labelsCheckbox = document.getElementById("showPointLabels");

// Event listeners related to points
examplesDropdown.addEventListener( "change", examplesDropdownListener );
function examplesDropdownListener(e) {
  if( e.target.value < examplePointSets.length ) {
    //resetButtonListener();
    //plotNewPoints(examplePointSets[e.target.value]);
    var exmpPoints = examplePointSets[e.target.value];
    exmpPoints = translatePointSetToBoundingBox( exmpPoints, board.getBoundingBox());
    pointSet = pointSet.concat(exmpPoints);
    updatePointTextbox();
    plotButtonListener();
  } else {
    //console.log("Point set control error!")
  }
}

randomButton.addEventListener( "click", randomButtonListener );
function randomButtonListener() {
  var randPoints = genRandPointSet(
    document.getElementById("numPoints").value
  );
  ////console.log(randPoints);
  //plotNewPoints( randPoints );
  pointSet = pointSet.concat(randPoints);
  updatePointTextbox();
  plotButtonListener();
}

resetButton.addEventListener( "click", resetButtonListener );
function resetButtonListener() {
  pointSet = [];
  clearBoard();
  clearPointTextbox();
}

plotButton.addEventListener( "click", plotButtonListener );
function plotButtonListener() {
  var userPoints = parsePointTextbox(pointsTextbox.value);
  resetButtonListener();
  plotNewPoints(userPoints);
}

labelsCheckbox.addEventListener( "click", function(e) {
  board.suspendUpdate();
  for( var i=0; i<boardPointSet.length; i++ ) {
    boardPointSet[i].setLabel(
      e.target.checked ? boardPointSet[i].name : ""
    );
  }
  showLabels = labelsCheckbox.checked;
  board.unsuspendUpdate();
});

function clearPointTextbox() {
  pointsTextbox.value = "";
}

function updatePointTextbox( points = pointSet ) {
  clearPointTextbox();
  var pointString = "";
  for( var i=0; i<points.length; i++ ) {
    pointString += points[i][0].toFixed(3).toString() + " " + points[i][1].toFixed(3).toString() + "\n";
  }
  pointsTextbox.value += pointString;
}

//Redone!
//Generate a random point within a square denoted by provided bounds.
function randomPointGen(xBound, yBound){
  var xPolarity = Math.random();
  var yPolarity = Math.random();

  if(xPolarity < .5)
    xPolarity = -1;
  else
    xPolarity = 1;

  if(yPolarity < .5)
    yPolarity = -1;
  else
    yPolarity = 1;

  return [xPolarity*Math.random()*xBound, yPolarity*Math.random()*yBound];
}

//Redone!
//Generate a pointset with n points.
function genRandPointSet(nPoints){
  var points = [];
  var boundingBox = board.getBoundingBox();
  var xBound = Math.max(Math.abs(boundingBox[0]), Math.abs(boundingBox[2]));
  var yBound = Math.max(Math.abs(boundingBox[1]), Math.abs(boundingBox[3]));
  console.log(yBound);
  for(var i=0; i<nPoints; i++){
    var point = randomPointGen(xBound, yBound);
    points.push(point);
  }
  return points;
}

function parsePointTextbox(userPointsString){
  userPoints = userPointsString.split(/\s|\t|\n/);
  var points = [];

  for(var i=0; i<userPoints.length; i+=2){
    var xCord = parseFloat(userPoints[i]);
    var yCord = parseFloat(userPoints[i+1]);
    if( isFinite(xCord)&&isFinite(yCord))
      points.push([xCord, yCord]);
  }
  return points;
}

function plotNewPoints( points ) {
  if(pointSet.length+points.length > POINT_LIMIT)
    alert("Too many points! Points > " + POINT_LIMIT + " will be truncated.");

  points.slice( 0, Math.max(POINT_LIMIT-pointSet.length,0) );

  var style = activeVertexStyle;
  style.withLabel = showLabels;

  board.suspendUpdate();
  for(var i=0; i<points.length; i++){
    style.name = (i+pointSet.length).toString();
    boardPointSet.push(board.create("point", points[i], style));
  }
  board.unsuspendUpdate();

  pointSet = pointSet.concat(points);
  updatePointTextbox(points);

  setNewBoundingBox();
}
