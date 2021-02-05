var boardParams = {
   boundingbox: [-16,16,16,-16],
   keepAspectRatio: true,
   axis: false,
   showCopyright: false,
   showScreenshot: true,
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
 strokeColor: '#e98570',
 strokeWidth: 4,
 fixed: true,
 straightFirst: false,
 straightLast: false,
 // name: "edge"+i,
};
var inactiveEdgeStyle = {
  strokeColor: '#AAAAAA',
  strokeWidth: 1,
  fixed: true,
  straightFirst: false,
  straightLast: false,
  // name: "delEdge"+i,
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
  strokeColor: '#e98570',
  fillColor: '#e98570',
};
var activeVertexStyle = {
  size: 1,
  fixed: true,
  strokeColor: '#174681',
  fillColor: '#174681',
};
