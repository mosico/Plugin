var pushDivObj	= document.getElementById("cmusPush");
var divHeight	= pushDivObj.offsetHeight;

console.log("Div height: " + divHeight);

var isShow		= false;
var showTime	= 8000;
var execTime	= 2000;
var intvalTime	= 20;
var leftHeight	= divHeight;
var velocity	= divHeight / execTime * intvalTime;
function closePopup() {
	var height	= parseInt(pushDivObj.style.height);
	console.log(pushDivObj.style.height, height);
	if (height == "NaN" || height >= divHeight) {
		leftHeight	= divHeight;
	}
	
	if (leftHeight > 0) {
		isShow		= false;
		leftHeight	-= velocity;
		pushDivObj.style.height	= leftHeight + "px";
		setTimeout(closePopup, intvalTime);
	} else {
		pushDivObj.style.height	= 0;
		isShow	= true;
	}
}

var curHeight	= 0;
function showPopup(isForce) {
	if (!isShow  && !isForce) return false;
	
	if (pushDivObj.style.height === "0px" || isForce) {
		curHeight	= 0;
	}
	
	if (curHeight < divHeight) {
		isShow		= true;
		curHeight	+= velocity;
		pushDivObj.style.height	= (curHeight > divHeight) ? divHeight + "px" : curHeight + "px";
		setTimeout(showPopup, intvalTime);
	} else {
		isShow	= false;
	}
}

// Slip down push info div
pushDivObj.style.height		= "1px";
pushDivObj.style.visibility	= "visible";
showPopup(true);

setTimeout(closePopup, showTime);
document.querySelector('#closePushInfo').addEventListener('click', closePopup);
document.querySelector('#cmusPush').addEventListener('click', showPopup);
