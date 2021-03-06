var Coupon = {
	couponData:null,
	
	display: function(tabId, changeInfo, tab) {
		if (changeInfo && changeInfo.status == "loading") {
			Mix.log("onUpdated", tab);
			var tabId	= tab.id;
			
			if (tab.url && (tab.url.indexOf("http") === 0)) {
				curTabUrl	= tab.url;
				curTabId	= tabId;
				Coupon.injectCss(tabId);
				Coupon.injectJs(tabId);
				
				Ajax.getUrlCoupon(tab.url, tabId, true, false, function(Data) {
					if (!Data || !Data.tabId) {
						Mix.log("Respond ajax data or tabId is empty !!");
						return false;
					}
					Coupon.matchCoupon(Data);
				});
			}
		}
	},
	
	matchCoupon: function(jsonData) {
		// User current view url is detail page, and has coupon, use regex match coupon
		if (jsonData.pageType === PT_DETAIL_PAGE) {
			if (jsonData.matchType === MT_ON_LINE) {
				this.onlineDetail(jsonData);
			} else if (jsonData.matchType === MT_OFF_LINE) {
				this.offlineDetail(jsonData);
			}
		// User current view url is shopping cart <checkout> page
		} else if(jsonData.pageType === PT_CART_PAGE) {
			this.matchCart(jsonData);
		// Search engine page
		} else if (jsonData.pageType === PT_SEARCH_ENGINE_PAGE) {
			this.matchSearch(jsonData);
		// User current view url is normal page
		} else {
			// Normal page or flow page
			Coupon.embedCoupon(jsonData);
		}
	},
	
	onlineDetail: function (jsonData) {
		this.loopTry(jsonData.tabId, jsonData, function(msg){
			// Request item refer coupon
			Ajax.getXpathReferCoupon(jsonData.url, jsonData.tabId, msg.prodName, msg.items, function(Res){
				$.extend(jsonData, Res);
				Coupon.embedCoupon(jsonData);
			});
		});
	},
	
	// Off line match get detail page product name
	offlineDetail: function (jsonData) {
		this.loopTry(jsonData.tabId, jsonData, function(msg){
			// Send ajax request get product name refer coupon
			if (msg && msg.prodName && msg.prodName.length > 0) {
				Mix.log("Get product coupon <detail page>");
				Ajax.getProdCoupon(jsonData.url, jsonData.tabId, msg.prodName, function(Res){
					$.extend(jsonData, Res);
					Coupon.embedCoupon(jsonData);
				});
			}
			// Not get product name use prev ajaxData coupon as unmatched
			else {
				Mix.log("Not Get product name from offline matche detail page");
				Coupon.embedCoupon(jsonData);
			}
		});
	},
	
	// Get shopping cart page products, by send dom request
	matchCart: function(ajaxData) {
		var xpath = null;
		if (ajaxData.pageRegular && ajaxData.pageRegular.itemXpath) {
			xpath = ajaxData.pageRegular.itemXpath;
		}
		
		if (xpath && xpath.length > 0) {
			// Get shopping cart product names, by send request to dom
			this.loopTry(ajaxData.tabId, ajaxData, function(msg){
				if (msg && msg.prodNames && msg.prodNames.length > 0) {
					Mix.log("Get product coupon <cart/checkout page>");
					Ajax.getProdCoupon(ajaxData.url, ajaxData.tabId, msg.prodNames, function(Res){
						$.extend(ajaxData, Res);
						Coupon.embedCoupon(ajaxData);
					});
				} else {
					Coupon.embedCoupon(ajaxData);
				}
			});
		}
	},
	
	// Search engine page request
	matchSearch: function (ajaxData) {
		var xpath = [];
		if (ajaxData.pageRegular && ajaxData.pageRegular.xpath) {
			xpath = ajaxData.pageRegular.xpath;
		}
		if (xpath.length < 1) return false;
		
		this.loopTry(ajaxData.tabId, ajaxData, function(response){
			// If has matched search item url, get url's coupon
			if (response.retCode === XPATH_SUCCESS || response.itemUrl && response.itemUrl.length > 0) {
				var xhrData = {
					"xpath": response.xpath,
					"keyword": response.keyword,
					"itemUrl": response.itemUrl
				};
				Ajax.getSeItemCoupon(ajaxData.url, ajaxData.tabId, xhrData, Coupon.appendSeItemCoupon);
				// After get item url, inject plugin to page
				Coupon.embedCoupon(ajaxData);
			}
		});
	},
	
	appendSeItemCoupon: function(jsonData) {
		//chrome.tabs.getSelected(null, function(tab){});
		jsonData.reqType	= PT_SEARCH_APPEND_COUPON;
		chrome.tabs.sendRequest(jsonData.tabId, jsonData, function(response) {
			Mix.log("Respond from append coupon to search page items (query dom)");
			// Send Error xpath to service
			if (response && response.error && response.error.length > 0) {
				Ajax.sendErrorXpath(jsonData.url, jsonData.tabId, Mix.formatErrorXpath(response.error), response.merRuleId);
			}
		});
		
		// Show matched merchant coupon num
		if (jsonData.count > 0) {
			jsonData.reqType	= PT_SEARCH_APPEND_MERNUM;
			chrome.tabs.sendRequest(jsonData.tabId, jsonData, function(response) {
				Mix.log("Respond from search page (show keyword matched coupon)");
				// Send Error xpath to service
				if (response && response.error && response.error.length > 0) {
					Ajax.sendErrorXpath(jsonData.url, jsonData.tabId, Mix.formatErrorXpath(response.error), response.merRuleId);
				}
			});
		}
	},
	
	// Loop try to get content page dom element
	loopTry: function(tabId, Data, callback) {
		var tryTimes		= 0;		// Post and only receive message times
		var tryConInterval	= null;
		var execSucTimes	= 0;		// Receive success content message times <one post may receive many times message>
		var postTimes		= 0;		// Post message to content page times
		var receiveTimes	= 0;		// Receive message from content page times
		var errorTimes		= 0;		// Return error xpath times <retry cause>
		var matchedCount	= 0;		// Matched coupon count
		var Port		= chrome.tabs.connect(tabId, {"name": "longConnectContent"});
		tryConInterval	= setInterval(function() {
			Port.postMessage(Data);
			postTimes++;
		}, XPATH_TRY_INTERVAL);
		
		Port.onMessage.addListener(function(msg) {
			Mix.log("Respond from detail/cart page content: ", msg);
			receiveTimes++;
			tryTimes	= Math.min(postTimes, receiveTimes);
			matchedCount	= msg.matched ? msg.matched.length : 0;
			
			// Send Error xpath to service
			if (msg && msg.error && (msg.error.length > 0) && (msg.retCode === XPATH_ERROR || msg.retCode === XPATH_DOM_COMPLETE)) {
				errorTimes++;
				if (errorTimes === 1) {
					chrome.tabs.getSelected(null, function(tab){
						Ajax.sendErrorXpath(Data.url, Data.tabId, Mix.formatErrorXpath(msg.error), msg.merRuleId);
					});
				}
			}
			
			// Error Or empty xpath
			if (msg && msg.retCode === XPATH_DOM_COMPLETE && (!msg.matched || msg.matched.length < 1) && (!msg.unMatched || msg.unMatched.length < 1)) {
				errorTimes++;
			}
			
			if (!msg || msg.retCode === XPATH_ERROR) {
				clearInterval(tryConInterval);
				tryConInterval	= null;
				Port			= null;
				Coupon.resetCouponOnError(errorTimes, matchedCount, Data);
			}
			if (msg.retCode === XPATH_SUCCESS || (tryTimes >= XPATH_TRY_TIMES && msg.retCode === XPATH_DOM_COMPLETE)) {
				clearInterval(tryConInterval);
				tryConInterval	= null;
				Port			= null;
				Coupon.resetCouponOnError(errorTimes, matchedCount, Data);
				execSucTimes++;
			}
			
			if ((msg.retCode === XPATH_SUCCESS) && execSucTimes === 1) {
				callback(msg);
			}
			// If occur xpath but matchedCount >0, call success function
			if (matchedCount > 0) {
				execSucTimes++;
				if (execSucTimes === 1) {
					callback(msg);
				}
			}
		});
		
		// Over 'XPATH_CLOSE_TIME' close connect
		setTimeout(function(){
			clearInterval(tryConInterval);
			tryConInterval	= null;
			Port			= null;
			Coupon.resetCouponOnError(errorTimes, matchedCount, Data);
		}, XPATH_CLOSE_TIME);
	},
	
	// Use merchant all coupon as unmatched code show in popup, if xpath error or over of try
	resetCouponOnError: function(errorTimes, matchedCount, Data) {
		if (errorTimes < 1 || matchedCount > 0) {
			return ;
		}
		
		// After xpath error and don't get/match any coupon, inject plugin to page
		Coupon.embedCoupon(Data);
	},
	
	injectCss: function(tabId) {
		chrome.tabs.insertCSS(tabId, {code: Storage.getCssFile(), runAt:"document_start"}, function() {
//			Mix.log("Injected Css...");
		});
	},
	injectJs: function(tabId) {
		chrome.tabs.executeScript(tabId, {code: Storage.getJsFile(), runAt:"document_start"}, function(){
//			Mix.log("Injected JS...");
		});
	},
	
	// Embed coupon to current page
	embedCoupon: function(Data){
		if (!Data) return false;
				
		Data.reqType	= PT_EMBED_COUPON;
		Data.version	= Storage.getLastVersion();
		Data.pushStatus	= Storage.getPushStatus();
		
		if (Data.tabId) {
			chrome.tabs.sendRequest(Data.tabId, Data, function(response) {
				Mix.log("Embed coupon to current visit page, after get url coupon", response);
			});
		} else {
			chrome.tabs.getSelected(null, function(tab){
				chrome.tabs.sendRequest(tab.id, Data, function(response) {
					Mix.log("Embed coupon to current visit page, after get url coupon", response);
				});
			});
		}
	},
};