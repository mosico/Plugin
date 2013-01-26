var Ajax = {
	postType: "POST",
	getType: "GET",
	htmlData: "html",
	jsonData: "json",
	
	
	// Common request param
	getParam: function(tabUrl, tabId, paramObj) {
		if (!tabUrl) tabUrl = "";
		if (!tabId) tabId = 0;
		var Param	= {
			url: tabUrl,
			tabId: tabId,
			uuid: Storage.getUuid(),
			version: Storage.getLastVersion()
		};
		if (typeof paramObj == "object") {
			$.extend(Param, paramObj);
		}
		return Param;
	},
	
	request: function(url, reqType, data, dataType, callback, notShowResult) {
		if (!reqType) reqType = "POST";
		if (!dataType) dataType = "json";
		
		Mix.log("XHR request data, reqType:"+ reqType +", dataType:"+ dataType, url, data);
		var curXhr = $.ajax({
	    	"url": url,
	    	"type": reqType,
	    	"data": data,
			"dataType": dataType,
			"timeout": REQUEST_TIMEOUT,
			"cache": false,
			"success": function(ResData) {
				if (!notShowResult) Mix.log(ResData);
				if (typeof callback === "function") {
					callback(ResData);
				}
			},
			"complete": function(jqXHR, status) {
				// status: "success", "notmodified", "error", "timeout", "abort", or "parsererror"
				if (status === "abort" || status === "parsererror") {
					Mix.log(jqXHR);
				}
				Mix.log("Ajax Request result: "+ status);
			}
		});
		
		return curXhr;
	},
	
	
	/*********************************  Get file info ****************************************
	 * ************************************************************
	 */
	getInitFile: function(tabUrl, tabId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		this.request(REQUEST_INIT_URL, this.postType, Param, this.jsonData, callback);
	},
	
	getJsFile: function(tabUrl, tabId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		this.request(REQUEST_JS_URL, this.getType, Param, this.htmlData, callback, true);
	},
	
	getCssFile: function(tabUrl, tabId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		this.request(REQUEST_CSS_URL, this.getType, Param, this.htmlData, callback, true);
	},
	
	
	/*********************************  Get Coupon  ****************************************
	 * ************************************************************
	 */
	// Get current page refer merchant's coupon
	getUrlCoupon: function(tabUrl, tabId, isLog, isSearch, callback) {
		var Param		= this.getParam(tabUrl, tabId);
		Param.isLog		= isLog ? 1 : 0;
		Param.isSearch	= isSearch ? 1 : 0;
		this.request(REQUEST_COUPON_URL, this.postType, Param, this.jsonData, callback);
	},
	
	// Request product name refer coupon
	getProdCoupon: function(tabUrl, tabId, prodName, cb) {
		var Param		= this.getParam(tabUrl, tabId);
		Param.prodName	= prodName;
		this.request(REQUEST_PRODUCT_COUPON_URL, this.postType, Param, this.jsonData, cb);
	},
	
	// Push user favorite/merchant's new coupons
	getPushCoupon: function(tabUrl, tabId, cb) {
		var Param		= this.getParam(tabUrl, tabId);
		this.request(REQUEST_PUSH_URL, this.postType, Param, this.jsonData, cb);
	},
	
	// Request search engine items coupon
	getSeItemCoupon: function(tabUrl, tabId, data, cb) {
		/*if (Request_se_curXhr) {
			Request_se_curXhr.abort();
			Request_se_curXhr	= null;
		}*/
		var Param	= this.getParam(tabUrl, tabId, data);
		this.request(REQUEST_SE_ITEM_COUPON_URL, this.postType, Param, this.jsonData, cb);
	},
	
	// Get online detail page's xpath refer coupon
	getXpathReferCoupon: function(tabUrl, tabId, productName, items, cb) {
		var Param	= this.getParam(tabUrl, tabId, {"proName": productName, "xpath":items});
		this.request(MATCH_DETAIL_PAGE_COUPON_URL, this.postType, Param, this.jsonData, cb);
	},
	
	
	/*********************************  Favorite option ****************************************
	 * ************************************************************
	 */
	// Add merchant to favorite
	addFavorite: function(tabUrl, tabId, merId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		Param.merId	= merId;
		this.request(ADD_MERCHANT_TO_FAVORITE, this.postType, Param, this.jsonData, callback);
	},
	
	// Remove merchant frome favorites
	removeFavorite: function(tabUrl, tabId, merId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		Param.merId	= merId;
		this.request(REMOVE_FAVORITE_MERCHANT, this.postType, Param, this.jsonData, callback);
	},
	
	// Snooze favorite merchant
	snoozeFavorite: function(tabUrl, tabId, merId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		Param.merId	= merId;
		this.request(SNOOZE_FAVORITE_URL, this.postType, Param, this.jsonData, callback);
	},

	// Get user all favorite merchants
	getFavorite: function(tabUrl, tabId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		this.request(SHOW_FAVORITE_MERCHANT, this.postType, Param, this.jsonData, callback);
	},
	
	
	/*********************************  Feedback info to server  ****************************************
	 * ************************************************************
	 */
	// Send error xpath
	sendErrorXpath: function(tabUrl, tabId, xpath, merRuleId, callback) {
		var Param		= this.getParam(tabUrl, tabId, {"xpath": xpath, "id":merRuleId});
		this.request(SEND_ERROR_XPATH, this.postType, Param, this.jsonData, callback);
	},
	// Push click
	sendPushClick: function(tabUrl, tabId, merId, callback) {
		var Param	= this.getParam(tabUrl, tabId);
		Param.merId	= merId;
		this.request(PUSH_CLICK_URL, this.postType, Param, this.jsonData, callback);
	},
};