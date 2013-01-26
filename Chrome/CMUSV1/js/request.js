var polling_ServerUrl = '';
var polling_CurViewUrl = '';
var polling_Type = '';
var polling_Sign = '';
var polling_WordStr = '';
var polling_Uuid = '';
var polling_IsLog = 0;
var polling_Callback = null;
var polling_CurXhr = null;
var Request_se_curXhr = null;
var Request_prod_curXhr = null;
var Request_push_curXhr = null;

function countPolling(serverUrl, curViewUrl, callback, isLog) {
	resetPollingVar();
	polling_ServerUrl = serverUrl;
	polling_CurViewUrl = encodeURI(curViewUrl);
	polling_Callback = callback;
	polling_Type = "count";
	polling_WordStr = getWordStr();
	polling_Uuid = getUuid();
	if (isLog) polling_IsLog = 1;
	
	polling(serverUrl, callback);
}

function codePolling(serverUrl, curViewUrl, callback) {
	resetPollingVar();
	polling_ServerUrl = serverUrl;
	polling_CurViewUrl = encodeURI(curViewUrl);
	polling_Callback = callback;
	polling_Type = "code";
	polling_Uuid = getUuid();
	
	polling(serverUrl, callback);
}

function resetPollingVar() {
	polling_ServerUrl = '';
	polling_CurViewUrl = '';
	polling_Type = '';
	polling_Sign = '';
	polling_WordStr = '';
	polling_Callback = null;
	polling_IsLog = 0;
	if (polling_CurXhr) {
		polling_CurXhr.abort();
		polling_CurXhr	= null;
	}
}


/**
 * data:{'type', 'sign'}
 * type:['count', 'code']
 * sign:string
 * 
 */
function polling(serverUrl, successCallback) {
	var data = {"url":polling_CurViewUrl, "wordStr": polling_WordStr, "uuid": polling_Uuid, "isLog": polling_IsLog};
	clog("polling()", serverUrl, data);
	polling_CurXhr = $.ajax({
    	"url": serverUrl,
    	"type": "POST",
    	"data": data,
		"dataType": "json",
		"timeout": REQUEST_POLLING_TIMEOUT,
		"success": function(jsonData){
			clog(jsonData);
			// call success callback function 
			if (typeof successCallback === "function") {
				successCallback(jsonData, polling_Type);
			}
		},
		"complete": function(jqXHR, status){
			// status: "success", "notmodified", "error", "timeout", "abort", or "parsererror"
			if (status === "abort" || status === "parsererror") {
				clog(jqXHR);
			}
			clog(status);
		}
	});
};

function callPolling() {
	clog("callPolling()");
	polling(polling_ServerUrl, polling_Callback);
}


// Request search engine items coupon
function reqSeItemCoupon(data, cb) {
	if (Request_se_curXhr) {
		Request_se_curXhr.abort();
		Request_se_curXhr	= null;
	}
	if (!data.uuid) {
		data.uuid = getUuid();
	}
	
	Request_se_curXhr = xhr(REQUEST_SE_ITEM_COUPON_URL, data, cb);
}


// Request product name refer coupon
function reqProdCoupon(tabUrl, prodName, cb) {
	if (Request_prod_curXhr) {
		Request_prod_curXhr.abort();
		Request_prod_curXhr	= null;
	}
	
	var data = {"url": tabUrl, "prodName": prodName, "uuid": getUuid()};
	Request_prod_curXhr = xhr(REQUEST_PRODUCT_COUPON_URL, data, cb);
}

// Check stored product coupon whether is expire
function checkCoupon(tabUrl, codes, cb) {
	var data = {"url": tabUrl, "codes": codes, "uuid": getUuid()};
	xhr(REQUEST_CHECK_COUPON_URL, data, cb);
}

// reqAlert
function reqAlert(tabUrl, uuid, type, cb) {
	var data = {"url": tabUrl,"uuid": uuid, "type": type};
	xhr(REQUEST_ALERT_URL, data, cb);
}

// Push user favorite / merchant's new coupons
function reqPushCoupon(uuid, time, version, cb) {
	if (Request_push_curXhr) {
		Request_push_curXhr.abort();
		Request_push_curXhr	= null;
	}
	var data = {"uuid": uuid, "time": time, "version": version};
	Request_push_curXhr	= xhr(REQUEST_PUSH_URL, data, cb);
}

// Send error xpath
function sendErrorXpath(tabUrl, xpath, merRuleId) {
	var data = {"url": tabUrl, "xpath": xpath, "id":merRuleId};
	xhr(SEND_ERROR_XPATH, data);
}

// Submit coupon click count
function sendClickCount(uuid, countInfo) {
	var data = {"uuid": uuid, "coupon": countInfo};
	xhr(SUBMIT_COUNT_XPATH, data);
}

// Submit user FB info
function sendFbInfo(uuid, token, userInfo) {
	var data = {"uuid": uuid, "token": token, "info": userInfo};
	xhr(SUBMIT_FB_INFO_XPATH, data);
}

// Submit user FB info
function reqUrl(callback) {
	xhr(GET_URLS, null, callback);
}

function xhr(url, data, cb) {
	clog("XHR request data", url, data);
	var curXhr = $.ajax({
    	"url": url,
    	"type": "POST",
    	"data": data,
		"dataType": "json",
		"timeout": REQUEST_TIMEOUT,
		"success": function(jsonData){
			clog(jsonData);
			if (typeof cb === "function") {
				cb(jsonData);
			}
		},
		"complete": function(jqXHR, status){
			// status: "success", "notmodified", "error", "timeout", "abort", or "parsererror"
			if (status === "abort" || status === "parsererror") {
				clog(jqXHR);
				// If ajax request is abort or result parser error, Don't call polling
			}
			clog(status);
		}
	});
	
	return curXhr;
}

