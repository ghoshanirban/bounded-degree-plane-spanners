

// Init point set
//examplesDropdown.dispatchEvent( new Event( 'change' ) );
algorithmSelectDropdown.dispatchEvent( new Event( 'change' ) );

var editPointsButton = document.getElementById('editPoints');
var aboutButton = document.getElementById('about');
var aboutShadowbox = document.getElementById('shadowbox');

var pointsOptions = document.getElementById('pointsOptions');
var algorithmOptions = document.getElementById('algorithmOptions');

var pointEditButtonText = "Edit Points";
var pointEditDoneText = "Select Algorithm";

editPointsButton.addEventListener( 'click', function() {
  if( pointsEditable ) {
    // disable click-to-place
    // hide pointsOptions
    pointsOptions.style.display = "none";
    // show algorithmOptions
    algorithmOptions.style.removeProperty('display');
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
  }
});
editPointsButton.dispatchEvent( new Event('click') );

aboutButton.addEventListener( 'click', function () {
  aboutShadowbox.style.zIndex = "101";
});

aboutShadowbox.addEventListener( 'click', function () {
  aboutShadowbox.style.removeProperty('z-index');
});
