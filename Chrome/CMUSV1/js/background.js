// Include js file
document.write('<script type="text/javascript" src="js/jquery.js"></script>');
document.write('<script type="text/javascript" src="js/com.js"></script>');
document.write('<script type="text/javascript" src="js/request.js"></script>');
document.write('<script type="text/javascript" src="js/iconBadge.js"></script>');
document.write('<script type="text/javascript" src="js/domain.js"></script>');
document.write('<script type="text/javascript" src="js/uuid.js"></script>');
document.write('<script type="text/javascript" src="js/response.js"></script>');
document.write('<script type="text/javascript" src="js/facebook.js"></script>');

function onActivated(activateInfo) {
	chrome.tabs.get(activateInfo.tabId, function(tab) {
		clog("onActivated", tab);
		// If current domain not equal last view url domain, hidden badge
		var curDomain = getUrlDomain(tab.url);
		var lastDomain = getLastDomain();
		if (curDomain != lastDomain) {
			hiddenBadge();
		}
		clog("current domain: " + curDomain + " -- last domain: " + lastDomain);
		
		if (tab.url && (tab.url.indexOf("http") === 0)) {
			saveUrlDomain(tab.url);
			// Use last matched coupon
			countPolling(REQUEST_COUPON_URL, tab.url, Response.callback);
		} else {
			disableBrowser(tab.id);
		}
	});
}

function onUpdated(tabId, changeInfo, tab) {
	if (changeInfo.status == "loading") {
		clog("onUpdated", tab);
		
		// If changed domain not equal last view url domain, hidden badge
		var curDomain = getUrlDomain(tab.url);
		var lastDomain = getLastDomain();
		if (curDomain != lastDomain) {
			hiddenBadge();
		}
		clog("current domain: " + curDomain + " -- last domain: " + lastDomain);
		
		if (tab.url && (tab.url.indexOf("http") === 0)) {
			saveUrlDomain(tab.url);
			countPolling(REQUEST_COUPON_URL, tab.url, Response.callback, true);
		} else {
			disableBrowser(tab.id);
		}
	}
}

function InsertSearchCss() {
	chrome.tabs.getSelected(function(tab){
		chrome.tabs.insertCSS(tab.id, {file:"css/search.css"});
	});
}

function disableBrowser(tabId) {
	chrome.browserAction.setPopup({popup: ""});
	
//	if (tabId) {
//		chrome.browserAction.disable(tab.id);
//	}
}

function showBrowser(tabId) {
	chrome.browserAction.setPopup({popup: "html/popup.html"});
}

// Get user last view url domain from local storage
function getLastDomain() {
	return localStorage.getItem('lastViewDomain');
}

// Get user current view url's domain
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

function saveUrlDomain(url) {
	domain = getUrlDomain(url);
	if (domain) {
		localStorage.setItem('lastViewDomain', domain);
	}
}

function getWords() {
	var wArr = localStorage.getItem('ignoreWords');
	if (wArr && typeof wArr == 'string' && wArr.length > 0) {
		wArr = JSON.parse(wArr);
	} else {
		wArr = [];
	}
	return wArr;
}

function storeWords(wordArr) {
	if (!wordArr || typeof wordArr != 'object' || wordArr.length < 1) {
		wordArr = [];
	}
	wordArr = JSON.stringify(wordArr);
	localStorage.setItem('ignoreWords', wordArr);
}

function getWordStr() {
	var wStr = localStorage.getItem('wordStr');
	if (!wStr) {
		wStr = "";
	}
	return wStr;
}

function storeWordStr(wordStr) {
	if (wordStr && typeof wordStr == 'string' && wordStr.length > 0) {
		localStorage.setItem('wordStr', wordStr);
	}
}


function isOrderAlert()
{
	var isal = localStorage.getItem("isOrderAlert");
	if (isal && isal == "true") {
		isal = true;
	} else {
		isal = false;
	}
	return isal;
}

function checkUuid() {
	var uuid = getUuid();
	if (!uuid) {
		uuid = Math.uuid();
		storeUuid(uuid);
	}
	return uuid;
}

function getUuid() {
	var uuid = localStorage.getItem("uuid");
	if (!uuid) {
		uuid = "";
	}
	return uuid;
}

function storeUuid(uuid) {
	if (uuid && typeof uuid == 'string' && uuid.length > 0) {
		localStorage.setItem("uuid", uuid);
	}
}

function reqestAlert() {
	var isReq = isOrderAlert();
	if (!isReq) {
		return ;
	}
	
	// If has not read alert coupon, change extension icon
	var hasNew = localStorage.getItem("hasNewAlert");
	if (hasNew && hasNew == "true") {
		chrome.browserAction.setIcon({"path": ICON_ALERT_FILE});
	}
	
	chrome.tabs.getSelected(null, function(tab){
		// Get user notify merchants all updated coupon
		reqAlert(tab.url, getUuid(), ALERT_GET_UPDATED, function(Da){
			if (Da && Da.coupon && Da.coupon.length > 0) {
				// Store merchant alert coupon
				localStorage.setItem("hasNewAlert", true);
				localStorage.setItem("merAlertCoupon", JSON.stringify(Da.coupon));
				// Change extension icon
				chrome.browserAction.setIcon({"path": ICON_ALERT_FILE});
			}
		});
	});
}

function reqAlertDomains() {
	var isReq = isOrderAlert();
	if (!isReq) {
		return ;
	}
	
	chrome.tabs.getSelected(null, function(tab){
		// Sync user turn on notify merchant domain
		reqAlert(tab.url, getUuid(), ALERT_GET_DOMAINS, function(Da){
			if (Da && Da.ret == RET_SUCCESS) {
				var domains = "";
				if (Da.domains && Da.domains.length > 0) {
					domains = JSON.stringify(Da.domains);
				}
				// Store user alert merchant domain
				localStorage.setItem("alertDomains", domains);
			}
		});
	});
}


function pushCoupon() {
	clog("Push coupon");
	var lastPushTime	= localStorage.getItem("lastPushTime");
	var uuid			= getUuid();
	if (!lastPushTime) {
		lastPushTime	= "";
	}
	
	// Request push coupons
	reqPushCoupon(uuid, lastPushTime, getVersion(), function(Res){
		if (Res && Res.content && Res.time && Res.viewTime) {
			// Store coupon click count submit interval time
			localStorage.setItem("couponSubmitTime", Res.clickSubmitTime * 1000);
			// Store notification request interval time
			localStorage.setItem("notifyRequestTime", Res.requestTime * 1000);
			// Store notification show time
			localStorage.setItem("notifyShowTime", Res.viewTime * 1000);
			
			// Store time as last push time
			localStorage.setItem("lastPushTime", Res.time);
			// Store data as last push coupons
			localStorage.setItem("lastPushCoupon", Res.content);
			
			// Reset setInterval
			clearInterval(notiHandle);
			notiHandle	= setInterval(pushCoupon, getNotiReqTime());
			
			// notification, delay 1s to get stored push coupon after storing
			setTimeout(showNotice, 1000);
		}
		// Store recent alert url
		if (Res.alert && Res.alert.length > 5) {
			localStorage.setItem("alertUrl", Res.alert);
		}
	});
}

function showNotice() {
	var notification = webkitNotifications.createHTMLNotification('html/notification.html');
	notification.show();
}

function instruction() {
	var lastVersion	= localStorage.getItem("lastVersion");
	var curVersion	= getVersion();
	clog("last version: "+ lastVersion, "Current version: "+ curVersion);
	
	if (lastVersion != curVersion) {
		var tutorial	= localStorage.getItem("tutorialUrl");
		if (!tutorial || tutorial.length < 5) return ;
		chrome.tabs.create({url:tutorial, active:true}, function(){
			localStorage.setItem("lastVersion", curVersion);
		});
	}
}

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

function getNotiReqTime() {
	var time	= localStorage.getItem("notifyRequestTime");
	if (!time || time < 1) {
		time	= PUSH_COUPON_INTERVAL;
	}
	return time;
}

function getCountTime() {
	var time	= localStorage.getItem("couponSubmitTime");
	if (!time || time < 1) {
		time	= COUNT_COUPON_INTERVAL;
	}
	return time;
}

function countCoupon() {
	var countInfo	= "";
	var infoStr		= localStorage.getItem("couponCount");
	if (infoStr && infoStr != "undefined") {
		countInfo	= JSON.parse(infoStr);
	}
	
	if (countInfo && countInfo.length > 0) {
		// Empty count info
		localStorage.setItem("couponCount", "");
		// Submit
		sendClickCount(getUuid(), countInfo, function(R){
			if (R.ret != 0) {
				// Reset count info
				localStorage.setItem("couponCount", infoStr);
			}
		});
		// Reset setInterval
		clearInterval(countHandel);
		countHandel	= setInterval(countCoupon, getCountTime());
	}
}

var reqUrlTimes	= 0;
function reqAndStoreUrl() {
	var isSec	= false;
	reqUrl(function(Res){
		if (Res) {
			if (Res.alert && Res.alert.length > 5) {
				localStorage.setItem("alertUrl", Res.alert);
			}
			if (Res.tutorial && Res.tutorial.length > 5) {
				isSec	= true;
				localStorage.setItem("tutorialUrl", Res.tutorial);
				// Open tutorial page
				instruction();
			}
		}
		// If fail, try again
		if (!isSec && reqUrlTimes < 10) {
			reqUrlTimes++;
			setTimeout(reqAndStoreUrl, 1e3);
		}
	});
}

var notiHandle	= null;
var countHandel	= null;
document.addEventListener('DOMContentLoaded', function(){
	chrome.tabs.onActivated.addListener(onActivated);
	chrome.tabs.onUpdated.addListener(onUpdated);
	checkUuid();
	// Push
	notiHandle	= setInterval(pushCoupon, getNotiReqTime());
	// Submit coupon count info
	countHandel	= setInterval(countCoupon, getCountTime());
	// Request url
	reqAndStoreUrl();
});