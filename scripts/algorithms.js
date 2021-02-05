/**
 *  Contains all the functions and data required for choosing algorithms.
 */

var algorithmSelectDropdown = document.getElementById("algorithmSelect");
var algorithmControls = document.getElementById("algorithmControls");
var algorithmResults = document.getElementById("algorithmResults")
var goButton = document.getElementById("go");
var testButton = document.getElementById("test");

var bgs2005Controls = document.getElementById("bgs2005_ctrl");
var lw2004Controls = document.getElementById("lw2004_ctrl");
var bsx2009Controls = document.getElementById("bsx2009_ctrl");
var kpx2010Controls = document.getElementById("kpx2010_ctrl");
var bcc2012Controls = document.getElementById("bcc2012_ctrl");
var bhs2017Controls = document.getElementById("bhs2017_ctrl");


algorithmSelectDropdown.addEventListener( "change", function(e) {
  // Change style.display properties of "algorithmControls" children so that only relevant controls are displayed
  // set all children of algorithmControls style.display = none;
  for( var i=0; i<algorithmControls.children.length; i++ )
    algorithmControls.children[i].style.display = "none";

  var ctrlDiv = algorithmControls.querySelector("#" + e.target.value + "_ctrl");
  if(ctrlDiv != null)
    ctrlDiv.style.display = "initial";
});

goButton.addEventListener( "click", goButtonListener );
function goButtonListener() {
  // clear board and redraw points
  plotButtonListener();
  pp.value = 0;
  playbackPosition = 0;

  var algorithm = algorithmSelectDropdown.value;
  var G = new Map();
  if(pointSet.length < 3){
    alert("Not enough points (" + pointSet.length + ")! Please add 3 or more points to the board.");
    return
  }
  switch(algorithm) {
    case "bgs2005":
      G=BGS2005Handler(bgs2005Controls);
      break;
    case "lw2004":
      G=LW2004Handler(lw2004Controls);
      break;
    case "bsx2009":
      G=BSX2009Handler(bsx2009Controls);
      break;
    case "kpx2010":
      G=KPX2010Handler(kpx2010Controls);
      break;
    case "bcc2012":
      G=BCC2012Handler(bcc2012Controls);
      break;
    case "bhs2017":
      G=BHS2017Handler(bhs2017Controls);
      break;
    case "dt":
      G = "DT";
      break;
  }

  switch(G){
    case "DT":
      var DT = createDelaunayTriangulation(pointSet);
      drawArrayGraph(pointSet,DT);
      console.log(DT);
      metrics = getMetrics(pointSet, DT, true);
      break;
    default:
      if(document.getElementById("showAnimation").checked){
        metrics = getMetrics(pointSet, G, false);
        eventQueue.push(new GraphEvent("path", "worstPath", metrics.stretchFactor.path));
        animate();
        playPause.click();
      }
      else{
      drawGraph(G);
      metrics = getMetrics(pointSet, G, false);
      drawPath(metrics.stretchFactor.path); // worst shortest path
      }
      console.log(G);
      
      break;
  }
  // add metrics calculations
  algorithmResults.style.display = "block";
  var resultString = "";
  resultString += '\\(|V| = '+metrics.N+'\\), &nbsp;&nbsp; \n';
  resultString += '\\(|E| = '+metrics.size+'\\), &nbsp;&nbsp; \n';
  resultString += 'stretch-factor (\\(t)\\) \\(= '+metrics.stretchFactor.t.toFixed(3)+'\\), &nbsp;&nbsp; \n';
  resultString += 'degree<sub>max</sub> \\(= '+metrics.max_degree+'\\), &nbsp;&nbsp; \n';
  resultString += 'degree<sub>avg</sub> \\(= '+metrics.avg_degree+'\\), &nbsp;&nbsp; \n';
  resultString += 'lightness (\\(\\frac{w_G}{w_{MST}}\\))\\( = '+ metrics.wtToMST +'\\) &nbsp;&nbsp; \n';
  algorithmResults.innerHTML = resultString;

  MathJax.typeset();
}

// testButton.addEventListener( 'click', function() {
//   resetButtonListener(); // ready,
//   randomButtonListener(); // get set,
//   // Set a timeout or else jsxgraph will complain about setting text labels of undefined jsx objects.
//   setTimeout( goButtonListener, 500 ); // go!
// });

function BHS2017Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#bhs2017_step").value,10);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      G = BHS2017(pointSet, true);
      break;
    case 2:
      G = BHS2017(pointSet);
      break;
  }
  var G_prime = createDelaunayTriangulation(pointSet);
  drawArrayGraph(pointSet,G_prime);
  return G;
}

function BCC2012Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#bcc2012_step").value,10);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      var k = ctrl.querySelector("#bcc2012_k").value;
      G = BCC2012(pointSet, k);
      break;
  }
  var G_prime = createDelaunayTriangulation(pointSet);
  drawArrayGraph(pointSet,G_prime);
  return G;
}

function KPX2010Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#kpx2010_step").value,10);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      var k = ctrl.querySelector("#kpx2010_k").value;
      G = KPX2010(pointSet, k);
      break;
  }
  var G_prime = createDelaunayTriangulation(pointSet);
  drawArrayGraph(pointSet,G_prime);
  return G;
}

function BSX2009Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#bsx2009_step").value,10);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      var alpha = ctrl.querySelector("#bsx2009_alpha").value;
      G = BSX2009(pointSet, alpha);
      break;
  }
  var G_prime = createDelaunayTriangulation(pointSet);
  drawArrayGraph(pointSet,G_prime);
  return G;
}

function LW2004Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#lw2004_step").value,10);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      var alpha = ctrl.querySelector("#lw2004_alpha").value;
      G = LW2004(pointSet, alpha);
      break;
  }
  var G_prime = createDelaunayTriangulation(pointSet);
  drawArrayGraph(pointSet,G_prime);
  return G;
}

function BGS2005Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#bgs2005_step").value,10);
  var dt = createDelaunayTriangulation(pointSet);

  drawArrayGraph(pointSet,dt);
  switch(step) {
    case 0:
      return "DT";
    case 1:
      G = spanningGraph(pointSet,dt);
      break;
    case 2:
      G = spanningGraph(pointSet,dt);
      transformPolygon(pointSet,dt,G);
      break;
    case 3:
      G = BGS2005(pointSet);
      break;
  }

  return G;
}
