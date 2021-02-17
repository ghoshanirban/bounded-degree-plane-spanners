

// Init point set
//examplesDropdown.dispatchEvent( new Event( 'change' ) );
algorithmSelectDropdown.dispatchEvent( new Event( 'change' ) );
clearBoard();

var editPointsButton = document.getElementById('editPoints');
var aboutButton = document.getElementById('about');
var aboutShadowbox = document.getElementById('shadowbox');

var pointsOptions = document.getElementById('pointsOptions');
var algorithmOptions = document.getElementById('algorithmOptions');

var pointEditButtonText = "Edit Points";
var pointEditDoneText = "Next";

editPointsButton.addEventListener( 'click', function() {
  if( pointsEditable ) {
    plotButtonListener();
    if(pointSet.length < 3){
    alert("Please add at least 3 points to the board.");
    return
    }
    // disable click-to-place
    // hide pointsOptions
    pointsOptions.style.display = "none";
    // show algorithmOptions
    algorithmOptions.style.display = "initial";
    // change button text to pointEditButtonText
    editPointsButton.innerText = pointEditButtonText;
    pointsEditable = false;
  } else {
    // enable click-to-place
    // show pointsOptions
    pointsOptions.style.removeProperty('display');
    // hide algorithmOptions
    algorithmOptions.style.display = "none";
    // change button text to pointEditDoneText
    editPointsButton.innerText = pointEditDoneText;
    pointsEditable = true;


    //reset algorithm selection
    document.getElementById("algorithmSelect").value ="";
    var algorithmControls = document.getElementById("algorithmControls");
    // Change style.display properties of "algorithmControls" children so that only relevant controls are displayed
    // set all children of algorithmControls style.display = none;
    for( var i=0; i<algorithmControls.children.length; i++ )
    algorithmControls.children[i].style.display = "none";
  }
});
//editPointsButton.dispatchEvent( new Event('click') );

aboutButton.addEventListener( 'click', function () {
  aboutShadowbox.style.zIndex = "102";
});

aboutShadowbox.addEventListener( 'click', function () {
  aboutShadowbox.style.removeProperty('z-index');
});


lw2004AlphaDis.innerHTML = lw2004Alpha.value;
bsx2009AlphaDis.innerHTML = bsx2009Alpha.value;
kpx2010DegDis.innerHTML = kpx2010DegMax.value;
bcc2012DegDis.innerHTML = bcc2012Deg.value;

