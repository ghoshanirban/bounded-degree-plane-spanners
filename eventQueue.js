//Playback
var test = document.getElementById('test'); // the text that will change
var pp = document.getElementById('pp'); // the slider
var playPause = document.getElementById('playPause');
var stepBackward = document.getElementById('stepBackward');
var stepForward = document.getElementById('stepForward');
var speed = document.getElementById('speed');

var animationTime = 30000;
var playing = false;
var playbackPosition = 0;
var playbackSymbols = [
  playPause.innerHTML,         // play
  '<span class="pause">&#9612;&#9612;</span>', // pause
];
var positionIncrementer;
var focus = new Map([
  [ "point", [] ],
  [ "line", [] ]
]);

function clearFocus(type, level=0) {
  // clear any focused objects
  var focusHierarchy = focus.get(type);
  while( focusHierarchy.length > 0 && focusHierarchy.length > level ) {
    var eventName = focusHierarchy.pop(); // remove the item from the array
    // remove the item at the end of the array from the board
    board.removeObject(boardObjects.get(eventName));
    // remove the item from boardObjects
    boardObjects.delete(eventName);
  }
}
function scrub() {
  var direction = pp.value - playbackPosition > 0 ? 1 : -1;
  while( pp.value != playbackPosition ) {
    // Moving forward...
    if(direction > 0){
      playbackPosition += direction;
      //console.log(playbackPosition);
    }

    var e = animationQueue[playbackPosition]

    if(!e.item.includes(undefined)){
          
      if( e.geoType == "point" || e.geoType == "line" ){
        // Events that add an object from the board
        if( (e.eventType == "add" && direction > 0) || (e.eventType == "remove" && direction < 0) ) {
          boardObjects.set(e.name, board.create(e.geoType, e.item, e.style));
        }
        // Events that remove an object from the board
        else if( (e.eventType == "add" && direction < 0) || (e.eventType == "remove" && direction > 0) ) {
          board.removeObject(boardObjects.get(e.name));
          boardObjects.delete(e.name);
        }
        // Events that highlight an object
        else if(direction > 0 && e.eventType == "highlight") {

          if( e.focus < 0 ) {
            clearFocus(e.geoType);
          } else {
            var eventName = "highlight"+e.geoType+e.focus.toString();
            //console.log(eventName, e.item);
            // clear the focus down to the current event's level
            clearFocus(e.geoType, e.focus);
            // get the right style
            var highlightStyle = e.geoType == "point" ? highlightPointStyle : highlightEdgeStyle;
            // put the new focus in boardObjects
            boardObjects.set(eventName, board.create(e.geoType, e.item, highlightStyle));
            // put the new focus in the array of the item's type
            focus.get(e.geoType).push(eventName);
            //console.log(focus.get("point"), focus.get("line"));
          }
        }
      }
      else if(e.eventType == "worstPath") {
        if(direction > 0) {
         // clear any focused objects
         clearFocus("point");
         clearFocus("line");
          boardObjects.set("worstPathPoint1", board.create("point", pointSet[e.item[0]], worstPathPointStyle));
          boardObjects.set("worstPathPoint2", board.create("point", pointSet[e.item[e.item.length-1]], worstPathPointStyle));

          for(var i=1;i<e.item.length; i++) {
            boardObjects.set("worstPathLine"+(i-1).toString(), board.create("line", [pointSet[e.item[i-1]], pointSet[e.item[i]]], worstPathEdgeStyle));
          }
        }
        else {
          for(var i=0;i<e.item.length-1; i++) {
            board.removeObject(boardObjects.get("worstPathLine"+i.toString()));
            boardObjects.delete("worstPathLine"+i.toString());
          }
          board.removeObject(boardObjects.get("worstPathPoint1"));
          boardObjects.delete("worstPathPoint1");
          board.removeObject(boardObjects.get("worstPathPoint2"));
          boardObjects.delete("worstPathPoint2");
        }
      }
    }
    // Moving backward
    if(direction < 0){
      clearFocus("point");
      clearFocus("line");
      playbackPosition += direction;
      //console.log(playbackPosition);
    }

  }
}

pp.addEventListener( 'input', scrub );
pp.addEventListener( 'mousedown', function() {
  clearInterval( positionIncrementer );
});
pp.addEventListener( 'mouseup', function() {
  if(playing)
    positionIncrementer = createAnimationInterval();
});

stepBackward.addEventListener( 'click', function() {
  var sliderPosition = Number(pp.value);
  if( !playing && sliderPosition > -1 ) {
    pp.value = sliderPosition - 1;
    scrub();
  }
});

stepForward.addEventListener( 'click', function() {
  var sliderPosition = Number(pp.value);
  var maxPosition = Number(pp.max);
  if( !playing && sliderPosition < maxPosition ) {
    pp.value = sliderPosition + 1;
    scrub();
  }
});

playPause.addEventListener( 'click', function() {
  playing = !playing;
  playPause.innerHTML = playbackSymbols[ Number(playing) ];
  if( playing ) { // play button pushed
    if( pp.value == pp.max ) {
      pp.value = -1;
      scrub();
    }
    positionIncrementer = createAnimationInterval();
  } else { // pause button pushed
    clearInterval( positionIncrementer );
  }
});

speed.addEventListener('change', function(){
  if(playing) {
    clearInterval( positionIncrementer );
    positionIncrementer = createAnimationInterval();
  }
});

function createAnimationInterval() {
  return window.setInterval( function() {
    var maxPosition = Number(pp.max);
    var sliderPosition = Number(pp.value);
    if( sliderPosition < maxPosition ) {
      pp.value = sliderPosition + 1;
      scrub();
    } else {
      clearInterval( positionIncrementer );
      playPause.click();
    }
  }, animationTime/Number(pp.max)/Number(speed.value) );
}



//EventQueue
var eventQueue = [];
var animationQueue = [];
var boardObjects = new Map();
var boardV = new Map();
var boardE = new Map();

class GraphEvent{
  constructor(geoType, eventType, item, style=null, description = ""){
    //"point", "line", "path"
    this.geoType = geoType;
    //Add, remove, highlight, worstPath.
    this.eventType = eventType;
    //Point or pair of points, array of points
    this.item = item;
    //Style for event
    this.style = style;
    //Description of the event for display
    this.description = description;
    //Name of the event
    this.name = this.item.toString();
  }
}

class HighlightEvent{
  constructor(geoType, item, focus=-1, description="", eventType="highlight"){
    //"point", "line", "path"
    this.geoType = geoType;
    //Point or pair of points, array of points
    this.item = item;
    //Highlight Level (optional)
    this.focus = focus;
    //Description of the event for display
    this.description = description;
    //Always Highlight
    this.eventType = eventType;
    //Name of the event
    this.name = this.item.toString();
  }
}

function clearEventQueue(){
  eventQueue = [];
  animationQueue = [];
  boardObjects = new Map();
  boardV = new Map();
  boardE = new Map();
}

function animate(){

  var V = new Map();
  var E = new Map();


  eventQueue.forEach(function(e){

    if(e.geoType == "point" && e.eventType == "add" && !V.has(e.name)){
        V.set(e.name, "");
        animationQueue.push(e);
    }

    else if(e.geoType == "line" && e.eventType == "add" && !E.has(e.name)){
        E.set(e.name, "");
        animationQueue.push(e);
    }

    else if(e.geoType == "point" && e.eventType == "remove" && V.has(e.name)){
        V.delete(e.name);
        animationQueue.push(e);
    }

    else if(e.geoType == "line" && e.eventType == "remove" && E.has(e.name)){
        E.delete(e.name);
        animationQueue.push(e);
    }

    else if (e.eventType == "highlight"){
      animationQueue.push(e);
    }

    else if (e.eventType == "worstPath"){
      animationQueue.push(e);
    }


  });

  pp.max = animationQueue.length-1;


}
