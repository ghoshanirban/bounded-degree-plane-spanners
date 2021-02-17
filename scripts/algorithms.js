/**
 *  Contains all the functions and data required for choosing algorithms.
 */

var algorithmSelectDropdown = document.getElementById("algorithmSelect");
var algorithmControls = document.getElementById("algorithmControls");
var algorithmResults = document.getElementById("algorithmResultsContainer")
var goButton = document.getElementById("go");
var testButton = document.getElementById("test");

var lw2004Alpha = document.getElementById("lw2004_alpha");
var lw2004AlphaDis = document.getElementById("lw2004_alpha_display");
var bsx2009Alpha = document.getElementById("bsx2009_alpha");
var bsx2009AlphaDis = document.getElementById("bsx2009_alpha_display");
var kpx2010DegMax = document.getElementById("kpx2010_k");
var kpx2010DegDis = document.getElementById("kpx2010_k_display");
var bcc2012Deg = document.getElementById("bcc2012_k");
var bcc2012DegDis = document.getElementById("bcc2012_k_display");

var legendLinkButton = document.getElementById("legendLink");
var legendShadowBox = document.getElementById("shadowboxLegend");

var edgeTextbox = document.getElementById("edgeOutput");

var bgs2005Controls = document.getElementById("bgs2005_ctrl");
var lw2004Controls = document.getElementById("lw2004_ctrl");
var bsx2009Controls = document.getElementById("bsx2009_ctrl");
var kpx2010Controls = document.getElementById("kpx2010_ctrl");
var bcc2012Controls = document.getElementById("bcc2012_ctrl");
var bhs2017Controls = document.getElementById("bhs2017_ctrl");
var showDelaunayCheckbox = document.getElementById("showDelaunayEdges");

var paperLinkButton = document.getElementById('paperLink');
var paperURLS = new Map();
paperURLS.set("bgs2005", "https://link.springer.com/article/10.1007%2Fs00453-005-1168-8");
paperURLS.set("lw2004", "https://www.worldscientific.com/doi/abs/10.1142/S0218195904001366");
paperURLS.set("bsx2009", "https://www.worldscientific.com/doi/abs/10.1142/S0218195909002861");
paperURLS.set("kpx2010", "https://epubs.siam.org/doi/10.1137/080737708");
paperURLS.set("bcc2012", "https://www.sciencedirect.com/science/article/pii/S1570866712000391?via%3Dihub");
paperURLS.set("bhs2017", "https://link.springer.com/article/10.1007%2Fs00453-017-0305-5");

algorithmSelectDropdown.addEventListener( "change", function(e) {
  // Change style.display properties of "algorithmControls" children so that only relevant controls are displayed
  // set all children of algorithmControls style.display = none;
  for( var i=0; i<algorithmControls.children.length; i++ )
    algorithmControls.children[i].style.display = "none";

  var ctrlDiv = algorithmControls.querySelector("#" + e.target.value + "_ctrl");
  if(ctrlDiv != null)
    ctrlDiv.style.display = "initial";
});

legendLinkButton.addEventListener("click", legendLinkListener);
function legendLinkListener(){
  legendShadowBox.style.zIndex = "101";
}

legendShadowBox.addEventListener( 'click', function () {
  legendShadowBox.style.removeProperty('z-index');
});

paperLinkButton.addEventListener("click", paperLinkButtonListener);
function paperLinkButtonListener() {
  if(document.getElementById("algorithmSelect").value == ""){
    alert("Please select an algorithm to see its paper.");
  }
  else{
    window.open(paperURLS.get(document.getElementById("algorithmSelect").value), '_blank');
  }
}


lw2004Alpha.addEventListener('change', lw2004AlphaListener);
function lw2004AlphaListener(){
  lw2004AlphaDis.innerHTML = lw2004Alpha.value;
}

bsx2009Alpha.addEventListener('change', bsx2009AlphaListener);
function bsx2009AlphaListener(){
  bsx2009AlphaDis.innerHTML = bsx2009Alpha.value;
}

kpx2010DegMax.addEventListener('change', kpx2010DegListener);
function kpx2010DegListener(){
  kpx2010DegDis.innerHTML = kpx2010DegMax.value;
}

bcc2012Deg.addEventListener('change', bcc2012DegListener);
function bcc2012DegListener(){
  bcc2012DegDis.innerHTML = bcc2012Deg.value;
}


goButton.addEventListener( "click", goButtonListener );
function goButtonListener() {
  // clear board and redraw points
  

  plotButtonListener();
  pp.value = 0;
  playbackPosition = 0;

  var algorithm = algorithmSelectDropdown.value;
  if(algorithmSelectDropdown.value == ""){
    alert("Please select an algorithm first.");
    return;
  }
  var G = new Map();
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
  var showAnimation = false; //document.getElementById("showAnimation").checked;
  switch(G){
    case "DT":
      var DT = createDelaunayTriangulation(pointSet);
      updateEdgeTextbox(DT, isDT=true);
      drawArrayGraph(pointSet,DT);
      console.log(DT);
      metrics = getMetrics(pointSet, DT, true);
      break;
    default:
      if(showAnimation){
        metrics = getMetrics(pointSet, G, false);
        eventQueue.push(new GraphEvent("path", "worstPath", metrics.stretchFactor.path));
        animate();
        playPause.click();
      }
      else{
        drawGraph(G);
        delaunayEdgeCheckboxListener();
        updateEdgeTextbox(G);
        metrics = getMetrics(pointSet, G, false);
        drawPath(metrics.stretchFactor.path); // worst shortest path
      }
      console.log(G);

      break;
  }


  // add metrics calculations
  //algorithmResults.style.display = "block";
  var resultString = "";
  resultString += '<span class="singleResult">\\(|V|: '+metrics.N+'\\)</span> \n';
  resultString += '<span class="singleResult">\\(|E|: '+metrics.size+'\\) </span> \n';
  resultString += '<span class="singleResult"> \\(\\textsf{Exact stretch factor:}\\) \\( '+metrics.stretchFactor.t.toFixed(3)+'\\) </span> \n';
  resultString += '<span class="singleResult"> \\(\\textsf{Exact degree:}\\) \\( '+metrics.max_degree+'\\) </span> \n';
  resultString += '<span class="singleResult">\\(\\textsf{Average degree:}\\) \\( '+metrics.avg_degree+'\\) </span> \n';
  resultString += '<span class="singleResult">\\(\\textsf{Lightness:}\\) \\( '+ metrics.wtToMST +'\\) </span> \n';
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
  //setTimeout(function(){delaunayEdgeCheckboxListener()}, 1);
  return G;
}

function BGS2005Handler(ctrl) {
  var G = new Map();
  var step = parseInt(ctrl.querySelector("#bgs2005_step").value,10);
  var dt = createDelaunayTriangulation(pointSet);

  //drawArrayGraph(pointSet,dt);
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
  drawArrayGraph(pointSet,dt);
  return G;
}

function clearEdgeTextbox() {
  edgeTextbox.value = "";
}

function updateEdgeTextbox( graph, isDT=false ) {
  if(isDT){
    graph = DTTOAL(graph);
  }
  var addedEdges = new Map();
  clearEdgeTextbox();
  var edgeString = "";
  for(var point of graph.keys()) {
    var neighbors = graph.get(point);
    for(var i=0; i<neighbors.length; i++){
      if(!addedEdges.has(makeEdgePair(point, neighbors[i]))){
        addedEdges.set(makeEdgePair(point, neighbors[i]), "");
        edgeString += point.toString() + " " + neighbors[i].toString() + "\n";
      }
    }
  }
  edgeTextbox.value += edgeString;
}
