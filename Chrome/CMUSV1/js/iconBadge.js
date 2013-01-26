
// Current/last blink num
var IconBadge_blinkNum = 0;
// Blink icon or badge times
var IconBadge_blinkTimes = 0;
// setInterval return id
var IconBadge_intvalId = null;

/**
 * hidden icon badge
 */
function hiddenBadge() {
//	clearBlink();
	chrome.browserAction.setBadgeText({"text": ''});
}

/**
 * show icon badge
 * @param num badge text
 * @param color badge background color
 */
function showBadge(num, color) {
	if (num === 0 || num === '0') {
		return '';
	}
	
	if (!color) {
		color = "#F00";
	}
	
	// Convert number type to string type
	if (typeof num === "number") {
		num = String(num);
	}
	chrome.browserAction.setBadgeText({"text": num});
	chrome.browserAction.setBadgeBackgroundColor({"color": color});
}

/**
 * blink icon badge
 * @param couponNum badge text
 */
function blinkIcon(couponNum) {
	// Clear badge blink
	clearBlink();
	IconBadge_blinkNum = couponNum;
	// Blink badge
	IconBadge_intvalId = setInterval(setBlinkBadge, 500);
}

function setBlinkBadge() {
	var showNum = '';
	if (IconBadge_blinkTimes % 2 == 0) {
		showNum = IconBadge_blinkNum;
	}
	showBadge(showNum, "#F00");
	IconBadge_blinkTimes ++;
}

/**
 * clear badge or icon blink interval
 */
function clearBlink() {
	if (IconBadge_intvalId) {
		clearInterval(IconBadge_intvalId);
		IconBadge_intvalId = null;
		showBadge(IconBadge_blinkNum, "#F00");
	}
}