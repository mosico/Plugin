var curCouponId		= 0;
var curCouponCode	= "";
var isFillCode		= false;

function getCouponCodes()
{
	chrome.tabs.getSelected(null, function(tab){
		clog('getSelected()', tab);
		
		// If icon blink, stop blink
//		var backgroundPage = chrome.extension.getBackgroundPage();
//		backgroundPage.clearBlink();
		
		if (tab.url && (tab.url.indexOf("http") === 0)) {
			Response.showPopupCoupon(tab.url);
		}
	});
}

// Get user current view url's domain
// Used in response.js
function getUrlDomain(url) {
	if (!url) return ;
	
	var matchHost = ((url||'')+'').match(/^http[s]?:\/\/([^\/]+)/);
	var urlHost = matchHost ? matchHost[1] : null;
	
	if(!urlHost) return ;
	
	var curDomain = urlHost;
	for (var i in AllDomainExt) {
		var domainExt = AllDomainExt[i].replace(".", "\\.");
		var RegPatt = new RegExp("([\\w\\-\\_]+)" + domainExt, "i");
		var match = urlHost.match(RegPatt);
		if (match) {
			curDomain = match[0];
			break;
		}
	}
	
	return curDomain;
}


var lcTime = null;
function copyToClipboard(str) {
	var isCopy = false;
	var obj=document.getElementById("clipboardText");
	if( obj ){
		obj.value = str;
		obj.select();
		isCopy = document.execCommand("copy", false, null);
	}
}

// Copy & Fill coupon code 
function autoFillCopy() {
	if (curCouponCode) {
		// Copy couponCode to clipboard
		copyToClipboard(curCouponCode);
		
		// Whether fill couponCode to input box
		if (isFillCode) {
			Response.fillCodeToInputBox(curCouponCode);
		}
	} else {
		clog("No coupon code");
	}
//	setTimeout(window.close, 200);
}

function countCouponClick() {
	var isExist		= false;
	var countInfo	= localStorage.getItem("couponCount");
	if (countInfo && countInfo != "undefined") {
		countInfo	= JSON.parse(countInfo);
		// Find current coupon click num
		for (var i in countInfo) {
			if (countInfo[i].couponId == curCouponId) {
				countInfo[i].clickCount ++;
				isExist	= true;
				break;
			}
		}
		if (!isExist) {
			countInfo.push({couponId:curCouponId, clickCount: 1});
		}
	} else {
		countInfo	= [{couponId:curCouponId, clickCount: 1}];
	}
	
	// Store coupon click count
	var str	= JSON.stringify(countInfo);
	localStorage.setItem("couponCount", str);
}


var _popLeft	= $(".popupLeft");
var _fillTips	= "Click to Fill/Copy";
var _copyTips	= "Click to Copy";
var _copied		= "Code copied";
var _copiedFill	= "Code filled/copied";
var copiedTips	= "";

function showLeftPopup(e) {
	_popLeft.clearQueue();
	var extArr		= $(this).attr("ext").split("-");
	var index		= extArr[0];
	var arrowTop	= (index - 1) * 33 + "px";
	var couponId	= $(this).attr("cid");
	var CouponInfo	= getCouponInfo(couponId);
	var tipText		= _copyTips;
	if (extArr[1] == 1) {
		tipText		= _fillTips;
		copiedTips	= _copiedFill;
	} else {
		copiedTips	= _copied;
	}
	
	// Whether fill couponCode to input box
	isFillCode		= (extArr[1] == 1) ? true : false;
	
	// If has coupon infomation and code change, fill to left popup
	if (CouponInfo && (curCouponCode != CouponInfo.code)) {
		curCouponCode	= CouponInfo.code;			// Current coupon code
		curCouponId		= CouponInfo.couponId;		// Current coupon id
		if (CouponInfo.save > 0) {
			$(".saveBox").html('Our customers have saved <br />over $'+ CouponInfo.save +'<br />at <span id="merName"></span>');
		} else {
			$(".saveBox").html('Redeeming Coupons<p style="text-align:left; color:white;">You simply need to copy the coupon code associated with that deal and enter that code during checkout.</p>');
		}
		$("#coupTitle").text(CouponInfo.title);
		$("#leftDesc").text(CouponInfo.descript);
		$("#expDate").text(CouponInfo.expireDate);
		$("#merName").text(Response.getCurDomain());
		
		// Remove copied style class
		$(".tipBlack").removeClass("tipOrange");
		$("#tipInfo").text(tipText);
	}
	
	var leftPopupPadbtn	= "15px";
	var leftPopupHeight	= "";
	var popLeftHeight	= _popLeft.height();
	var coupListHeight	= $(".couponlist").height();
	if (popLeftHeight <= coupListHeight) {
		leftPopupHeight	= coupListHeight + "px";
	}
	if (coupListHeight > 299) {
		leftPopupPadbtn	= "0px";
	}
	
	$(this).addClass("mhover");
	$(".main").css({width:"615px"});
	$(".detailArrow").css("top", arrowTop);
	_popLeft.css({"min-height":leftPopupHeight, "padding-bottom":leftPopupPadbtn}).show();
}

function hideLeftPopup() {
	$(this).removeClass("mhover");
	_popLeft.delay(1000).queue(function(){
		$(".main").css({width:"370px"});
		_popLeft.hide();
	});
}

function alertUrl() {
	var uuid	= chrome.extension.getBackgroundPage().getUuid();
	var alert	= localStorage.getItem("alertUrl");
	var url		= (alert && alert.length > 0) ? alert : NOTIFICATION_PAGE_URL;
	$(".alert a").attr("href", url + uuid);
}

function getCouponInfo(couponId) {
	var Coupon		= null;
	var popupCoup	= Response.getPopupCoupon();
	
	if (popupCoup && (popupCoup.matched || popupCoup.unMatched)) {
		var allCoup	= [];
		if (popupCoup.matched.length > 0) {
			allCoup	= popupCoup.matched;
		}
		if (popupCoup.unMatched.length > 0) {
			allCoup	= allCoup.concat(popupCoup.unMatched);
		}
		for (var i in allCoup) {
			if (allCoup[i].couponId == couponId) {
				Coupon	= allCoup[i];
				break;
			}
		}
	}
	
	return Coupon;
}

function showTips(e) {
	var pageX	= (e.pageX > 505) ? 505 : e.pageX;
	$(".tipBlack").css({left: pageX + 5, top:e.pageY - 30}).show();
}

function hideTips() {
	$(".tipBlack").hide();
}

function ChgCopiedTips() {
	console.log("Change copied text");
	$(".tipBlack").addClass("tipOrange");
	$("#tipInfo").text(copiedTips);
}

document.addEventListener('DOMContentLoaded', function(){
	hideTips();
	_popLeft	= $(".popupLeft");
	alertUrl();
	getCouponCodes();
	$(".coupon").live("mouseenter", showLeftPopup);
	$(".coupon").live("mouseleave", hideLeftPopup);
	_popLeft.mouseenter(function(){
		_popLeft.clearQueue();
	}).mouseleave(hideLeftPopup);
	
	$(".popupLeft").mousemove(showTips).mouseleave(hideTips).click(function(){
		// Copy coupon code to clipboard, and fill code to inputbox if need
		autoFillCopy();
		// Count coupon click num
		countCouponClick();
		// When copied coupon code, change the tips's style and text
		ChgCopiedTips();
	});
	$(".couponlist").mousemove(showTips).mouseleave(hideTips).click(function(){
		autoFillCopy();
		countCouponClick();
		ChgCopiedTips();
	});
	// Cursor on tips, show left popup
	$(".tipBlack").mouseenter(function(){
		_popLeft.clearQueue();
	});
	
	// Change Page
	$(".Prev").live("click", function(){
		Response.showPageCoupon(false);
	});
	$(".Next").live("click", function(){
		Response.showPageCoupon(true);
	});
});