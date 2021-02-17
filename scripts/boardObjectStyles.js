var boardParams = {
   boundingbox: [-16,16,16,-16],
   keepAspectRatio: true,
   axis: false,
   showCopyright: false,
   //showScreenshot: true,
 };

var activeEdgeStyle = {
  strokeColor: '#174681',
  strokeWidth: 2,
  fixed: true,
  straightFirst: false,
  straightLast: false,
  // name: "edge"+i,
};
var highlightEdgeStyle = {
 strokeColor: '#97aac2',
 strokeWidth: 6,
 fixed: true,
 straightFirst: false,
 straightLast: false,
 // name: "edge"+i,
};
var worstPathEdgeStyle = {
 strokeColor: '#ff0000',
 strokeWidth: 4,
 fixed: true,
 straightFirst: false,
 straightLast: false,
 // name: "edge"+i,
};
var inactiveEdgeStyle = {
  strokeColor: '#AAAAAA',
  strokeWidth: 2,
  fixed: true,
  straightFirst: false,
  straightLast: false,
  //strokeOpacity: 0.3,
  //name: "delaunayEdge",
};

var highlightPointStyle = {
  size: 6,
  withLabel: false,
  fixed: true,
  strokeColor: '#97aac2',
  fillColor: '#97aac2',
};
var worstPathPointStyle = {
  size: 4,
  withLabel: false,
  fixed: true,
  strokeColor: '#ff0000',
  fillColor: '#ff0000',
  face: "square",
};
var activeVertexStyle = {
  size: 1,
  fixed: true,
  strokeColor: '#174681',
  fillColor: '#174681',
};

var semiActiveEdgeStyle = {
  strokeColor: '#174681',
  strokeWidth: 2,
  fixed: true,
  straightFirst: false,
  straightLast: false,
  dash: 2,
  // name: "edge"+i,
};
