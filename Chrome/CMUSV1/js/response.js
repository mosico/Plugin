
// Deal ajax respond data
(function(){
// Response class
var Response = function() {
	var ajaxData			= null;
	var curPageInputXpath	= [];
	var popupCoupon			= null;
	var curDomain			= "CMUS coupon";
	var prevPageCoupon		= {"matched":[], "unMatched":[]};
	var NextPageCoupon		= {"matched":[], "unMatched":[]};
	var canFillCode			= false;
	var curMerRuleId		= 0;
	
	// Ajax success or completed, call back url
	this.callback = function (jsonData, requestType) {
		ajaxData		= jsonData;
		curMerRuleId	= jsonData.id ? jsonData.id : 0;
		
		if (requestType !== "code") {
			requestType = "count";
		}
		
		// If not get coupon Or Error, reset last matchted coupon info
		if (!jsonData || !jsonData.count || jsonData.ret !== RET_SUCCESS) {
			// Hide badge
			hiddenBadge();
			chrome.tabs.getSelected(function(tab){
				// If current tab don't has coupon, disable browser
				disableBrowser(tab.id);
				// Reset last store coupon
				var lastStoredCoup	= getLastMatchCoupon(tab.url);
				if (lastStoredCoup && (lastStoredCoup.matched || lastStoredCoup.unMatched)) {
					storeLastMatchCoupon(tab.url, {"matched":[], "unMatched":[]});
				}
			});
			
			// If current page isn't search engine page, then return null
			if (jsonData.pageType != PT_SEARCH_ENGINE_PAGE) {
				return ;
			}
		} else {
			// If has coupon, show popup
			showBrowser();
		}
		
		// User current view url is detail page, and has coupon, use regex match coupon
		if (jsonData.pageType === PT_DETAIL_PAGE) {
			if (jsonData.matchType === MT_ON_LINE) {
				detailDomRequest(jsonData, requestType);
			} else if (jsonData.matchType === MT_OFF_LINE) {
				offDetailDomReq(jsonData);
			}
		// User current view url is shopping cart <checkout> page
		} else if(jsonData.pageType === PT_CART_PAGE) {
			cartDomRequest();
		// User current view url is buy(pay) flow page
		} else if(jsonData.pageType === PT_FLOW_PAGE) {
			// Get last match store coupon
			chrome.tabs.getSelected(function(tab){
				var storedCoupon = getLastMatchCoupon(tab.url);
				clog('Flow page get stored coupon', storedCoupon);
				if (requestType === "count") {
					countFlow(storedCoupon);
				} else {
					codeFlow(storedCoupon);
				}
			});
		// Search engine page
		} else if (jsonData.pageType === PT_SEARCH_ENGINE_PAGE) {
			clog("Search Engin Page (return xpath from server)");
			seDomRequest();
		// User current view url is normal page
		} else {
			if (requestType === "count") {
				countNormal();
			} else {
				codeNormal();
			}
			// Save coupon
			chrome.tabs.getSelected(function(tab){
				storeLastMatchCoupon(tab.url);
			});
		}
		
		// Store ignore words and md5 string
		if (jsonData.wordStr && jsonData.words) {
			storeWordStr(jsonData.wordStr);
			storeWords(jsonData.words);
		}
		
		// Store current page regular
		if (jsonData.pageRegular) {
			chrome.tabs.getSelected(function(tab){
				storePageRegular(tab.url, jsonData.pageRegular);
			});
		}
	};
	
	// Public get stored page regular
	this.getPageRegular = function(url) {
		return getStorePageRegular(url);
	};
	
	this.getCurDomain = function(){
		return curDomain;
	};
	
	this.getPrevPageCoupon = function(){
		return prevPageCoupon;
	};
	
	this.getNextPageCoupon = function(){
		return NextPageCoupon;
	};
	
	this.getPopupCoupon = function(){
		return popupCoupon;
	};
	
	// Show coupon info on popup layer
	this.showPopupCoupon = function (url) {
		popupCoupon = getLastMatchCoupon(url);
		var storedPageRegular = getStorePageRegular(url);
		var isFillCode = false;
		if (storedPageRegular && storedPageRegular.inputXpath && 
			storedPageRegular.inputXpath.length > 0 && storedPageRegular.inputXpath[0]) {
			isFillCode = true;
			curPageInputXpath = storedPageRegular.inputXpath;
		}
		
		showCouponCode(popupCoupon, isFillCode);
		
		clog("Show popup layer, popup get stored coupon", popupCoupon, storedPageRegular);
	};
	
	// Fill coupon code to input box
	this.fillCodeToInputBox = function (code) {
		if (!code || !curPageInputXpath || curPageInputXpath.length <= 0) {
			return ;
		}
		
		chrome.tabs.getSelected(function(tab){
			var request = {
				"tabUrl": tab.url,
				"pageType" : PT_FILL_CODE,
				"inputXpath" : curPageInputXpath,
				"code": code
			};
			chrome.tabs.sendRequest(tab.id, request, function(response) {
				clog("Auto fill code to input box", response);
				// Send Error xpath to service
				if (response && response.error && response.error.length > 0) {
					sendErrorXpath(tab.url, formatErrorXpath(response.error), curMerRuleId);
				}
			});
		});
	};
	
	
	// Loop try to get content page dom element
	var loopTry = function(tabId, postMsg, callback) {
		var tryTimes		= 0;		// Post and only receive message times
		var tryConInterval	= null;
		var execSucTimes	= 0;		// Receive success content message times <one post may receive many times message>
		var postTimes		= 0;		// Post message to content page times
		var receiveTimes	= 0;		// Receive message from content page times
		var errorTimes		= 0;		// Return error xpath times <retry cause>
		var Port		= chrome.tabs.connect(tabId, {"name": "longConnectContent"});
		tryConInterval	= setInterval(function() {
			Port.postMessage(postMsg);
			postTimes++;
		}, XPATH_TRY_INTERVAL);
		
		Port.onMessage.addListener(function(msg) {
			clog("Respond from detail/cart page content: ", msg);
			receiveTimes++;
			tryTimes	= Math.min(postTimes, receiveTimes);
			
			// Send Error xpath to service
			if (msg && msg.error && (msg.error.length > 0) && (msg.retCode === XPATH_ERROR || msg.retCode === XPATH_DOM_COMPLETE)) {
				errorTimes++;
				if (errorTimes === 1) {
					chrome.tabs.getSelected(function(tab){
						sendErrorXpath(tab.url, formatErrorXpath(msg.error), curMerRuleId);
					});
				}
			}
			
			if (!msg || msg.retCode === XPATH_ERROR) {
				clearInterval(tryConInterval);
				tryConInterval	= null;
				Port			= null;
				resetCouponOnError(errorTimes);
				return ;
			}
			if (msg.retCode === XPATH_SUCCESS || (tryTimes >= XPATH_TRY_TIMES && msg.retCode === XPATH_DOM_COMPLETE)) {
				clearInterval(tryConInterval);
				tryConInterval	= null;
				Port			= null;
				resetCouponOnError(errorTimes);
				execSucTimes++;
			}
			
			if (msg.retCode === XPATH_SUCCESS && execSucTimes === 1) {
				callback(msg);
			}
		});
		
		// Over 'XPATH_CLOSE_TIME' close connect
		setTimeout(function(){
			clearInterval(tryConInterval);
			tryConInterval	= null;
			Port			= null;
			resetCouponOnError(errorTimes);
		}, XPATH_CLOSE_TIME);
	};
	
	// Use merchant all coupon as unmatched code show in popup, if xpath error or over of try
	var resetCouponOnError = function(errorTimes) {
		if (errorTimes < 1) {
			return ;
		}
		
		// Set show number
		countNormal();
		// Set last matched coupon
		chrome.tabs.getSelected(function(tab){
			storeLastMatchCoupon(tab.url, null);
		});
	};
	
	
	//Send a request to the content script.
	var detailDomRequest = function (jsonData, requestType) {
		chrome.tabs.getSelected(function(tab){
			var postMsg = {
				"tabUrl": tab.url,
				"pageType" : jsonData.pageType,
				"matchType" : jsonData.matchType,
				"pageRegular" : jsonData.pageRegular,
				"couponArr": jsonData.coupon
			};
			
			loopTry(tab.id, postMsg, function(msg){
				countDetail(msg);
				// Save current product page match and unMatch coupon to localStorage
				storeLastMatchCoupon(tab.url, msg);
				storeProdCoupon(tab.url, msg);
			});
		});
	};
	
	// Off line match get detail page product name
	var offDetailDomReq = function (jsonData) {
		chrome.tabs.getSelected(function(tab){
			var postMsg = {
				"pageType" : jsonData.pageType,
				"matchType" : jsonData.matchType,
				"pageRegular" : jsonData.pageRegular,
			};
			
			loopTry(tab.id, postMsg, function(msg){
				// Send ajax request get product name refer coupon
				if (msg && msg.prodName && msg.prodName.length > 0) {
					clog("Get product coupon <detail page>");
					reqProdCoupon(tab.url, msg.prodName, function(pcd){
						clog("Product name refer coupon info data", pcd);
						countDetail(pcd);
						// Save current product page match and unMatch coupon to localStorage
						storeLastMatchCoupon(tab.url, pcd);
					});
				}
				// Not get product name use prev ajaxData coupon as unmatched
				else {
					clog("Not Get product name from offline matche detail page");
					var rsp = {"matched": [], "unMatched" : ajaxData.coupon};
					countDetail(rsp);
					// Save current product page match and unMatch coupon to localStorage
					storeLastMatchCoupon(tab.url, rsp);
				}
			});
		});
	};
	
	// Get shopping cart page products, by send dom request
	var cartDomRequest = function() {
		chrome.tabs.getSelected(function(tab){
			var xpath = null;
			if (ajaxData.pageRegular && ajaxData.pageRegular.itemXpath) {
				xpath = ajaxData.pageRegular.itemXpath;
			}
			
			if (xpath && xpath.length > 0) {
				var request = {
					"tabUrl": tab.url,
					"pageType" : ajaxData.pageType,
					"matchType" : ajaxData.matchType,
					"xpath" : xpath,
				};
				
				// Get shopping cart product names, by send request to dom
				loopTry(tab.id, request, function(Res){
					// Offline match, get product coupon from server
					if (ajaxData.matchType === MT_OFF_LINE) {
						// Has prodName
						if (Res && Res.prodNames && Res.prodNames.length > 0) {
							clog("Get product coupon <cart/checkout page>");
							reqProdCoupon(tab.url, Res.prodNames, function(pcd){
								clog("Product name refer coupon", pcd);
								// If not matched, use last matched coupon or domain coupon
								countCart(pcd, tab.url);
							});
						} else {
							countCart(null, tab.url);
						}
					}
					// Online match
					else {
						var matched = [];
						var unMatched = [];
						// If get product's name, match it with stored product coupon
						if (Res && Res.prodNames && Res.prodNames.length > 0) {
							var spd = getProdCoupon(tab.url);
							if (spd && spd.length > 0) {
								// Match coupon with product name
								for (var i in Res.prodNames) {
									for (var j in spd) {
										var isM = compare(Res.prodNames[i], spd[j].prodName);
										if (isM) {
											matched.push(spd[j]);
										}
									}
								}//End match
							}
						}
						if (matched.length > 0) {
							matched = uniCoupon(matched);
							// Get coupon code
							var ca = [];
							for (var i in matched) {
								ca.push(matched[i].code);
							}
							// Check code is't expire
							checkCoupon(tab.url, ca, function(cd){
								// Has expire code
								if (cd && cd.ret == RET_SUCCESS && cd.expire && cd.expire.length > 0) {
									var validCode = [];
									// Remove expire code from matched
									for (var i in matched) {
										var isEx = false;
										for(var j in cd.expire) {
											if (cd.expire[j] == matched[i].code) {
												isEx = true;
												break;
											}
										}
										if (!isEx) {
											validCode.push(matched[i]);
										}
									}
									// Has valide coupon code
									if (validCode.length > 0) {
										unMatched = diffCoupon(ajaxData.coupon, validCode);
										countCart({matched: validCode, unMatched: unMatched}, tab.url);
									}
									// Not has product coupon
									else {
										countCart(null, tab.url);
									}
									// Delete stored product expire coupon
									delProdExripCoupon(tab.url, cd.expire);
								}
								// Has't expire code
								else {
									unMatched = diffCoupon(ajaxData.coupon, matched);
									countCart({matched: matched, unMatched: unMatched}, tab.url);
								}
							});
						// Not matched product coupon, use site coupon
						} else {
							countCart(null, tab.url);
						}
					}
				});
				
			// Not have product item xpath, use site coupon
			} else {
				countCart(null, tab.url);
				clog("Not shopping cart product item xpath");
			}
		});
	};
	
	// Compare tow string
	var compare = function (str1, str2) {
		var isMatch = false;
		
		str1 = str1.toLowerCase();
		str2 = str2.toLowerCase();
		
		if (str1 == str2) {
			isMatch = true;
		} else {
			var word = '';
			var wArr = getWords();
			wArr.push("[^\\w+]");
			word = wArr.join("|");
			var Reg = new RegExp(word, "g");
			
			str1 = str1.replace(Reg, '');
			str2 = str2.replace(Reg, '');
			
			var len1 = str1.length;
			var len2 = str2.length;
			
			var len = Math.min(len1,len2);
			len = parseInt(MATCH_NAME_RATE * len);
			
			var s1 = str1.substr(0, len);
			var s2 = str2.substr(0, len);
			
			if (s1 == s2) {
				isMatch = true;
			}
		}
		
		return isMatch;
	};
	
	// Remove same code in a coupon array
	var uniCoupon = function (arr) {
		var ret = [];
		for (var i in arr) {
			var isExist = false;
			for (var j in ret) {
				if (arr[i].code == ret[j].code && arr[i].title == ret[j].title) {
					isExist = true;
					break;
				}
			}
			if (!isExist) {
				ret.push(arr[i]);
			}
		}
		
		return ret;
	};
	
	// Extract coupon in arr1 but not in arr2
	var diffCoupon = function (arr1, arr2) {
		var ret = [];
		for (var i in arr1) {
			var isExist = false;
			for (var j in arr2) {
				if (arr1[i].code == arr2[j].code) {
					isExist = true;
					break;
				}
			}
			if (!isExist) {
				ret.push(arr1[i]);
			}
		}
		
		return ret;
	};
	
	// Search engine page request
	var seDomRequest = function () {
		chrome.tabs.getSelected(function(tab){
			var xpath = [];
			if (ajaxData.pageRegular && ajaxData.pageRegular.xpath) {
				xpath = ajaxData.pageRegular.xpath;
			}
			var request = {
				"tabUrl": tab.url,
				"pageType" : ajaxData.pageType,
				"xpath" : xpath,
			};
			
			loopTry(tab.id, request, function(response){
				// If has matched search item url, get url's coupon
				if (response.retCode === XPATH_SUCCESS || response.itemUrl && response.itemUrl.length > 0) {
					var xhrData = {
						"tabUrl": tab.url,
						"xpath": response.xpath,
						"keyword": response.keyword,
						"itemUrl": response.itemUrl
					};
					reqSeItemCoupon(xhrData, appendSeItemCoupon);
				}
			});
		});
	};
	
	var appendSeItemCoupon = function(jsonData) {
		chrome.tabs.getSelected(function(tab){
			var merName	= jsonData.merName ? jsonData.merName : "";
			var request = {
				"tabUrl": tab.url,
				"pageType" : PT_SEARCH_APPEND_COUPON,
				"xpathArr" : jsonData.xpath,
				"couponArr": jsonData.coupon
			};
			chrome.tabs.sendRequest(tab.id, request, function(response) {
				clog("Respond from append coupon to search page items (query dom)");
				// Send Error xpath to service
				if (response && response.error && response.error.length > 0) {
					sendErrorXpath(tab.url, formatErrorXpath(response.error), curMerRuleId);
				}
			});
			
			// Show matched merchant coupon num
			if (jsonData.count > 0) {
				// Insert keyword refer merchant coupon css to page 
				InsertSearchCss();
//				chrome.tabs.insertCSS(tab.id, {file:chrome.extension.getURL("css/search.css")});
				var resultRes	= {
						"tabUrl": tab.url,
						"pageType": PT_SEARCH_APPEND_MERNUM,
						"xpathArr": jsonData.xpath,
						"count": jsonData.count,
						"numUrl": jsonData.matchedNumUrl,
						"merName": merName,
						"merUrl": jsonData.merUrl
					};
				chrome.tabs.sendRequest(tab.id, resultRes, function(response) {
					clog("Respond from search page (show keyword matched coupon)");
					// Send Error xpath to service
					if (response && response.error && response.error.length > 0) {
						sendErrorXpath(tab.url, formatErrorXpath(response.error), curMerRuleId);
					}
				});
			}
			
			
//			// Show keyword refer merchant coupon count, and store coupon
//			if (!jsonData.count || jsonData.count == 0) {
//				hiddenBadge();
//			} else {
//				showBadge(jsonData.count, BADGE_BG_COLOR_MATCHED);
//			}
			
//			storeLastMatchCoupon(tab.url, {"matched": jsonData.refer, "unMatched": [], "merName": merName});
		});
	};
	
	// Count type (background page), normal page
	var countNormal = function () {
		showBadge(ajaxData.count, BADGE_BG_COLOR_SITE);
	};
	
	// Code type (popup layer), normal page
	var codeNormal = function () {
		var Coupon = {"matched": [], "unMatched": ajaxData.coupon};
		showCouponCode(Coupon);
	};
	
	// Count type (background page), flow page
	var countFlow = function (storedCoupon) {
		var count = '';
		var isMat = false;
		if (storedCoupon && typeof storedCoupon === "object") {
			if (storedCoupon.matched && storedCoupon.matched.length > 0) {
				count = storedCoupon.matched.length;
				isMat = true;
			} else if (storedCoupon.unMatched && storedCoupon.unMatched.length > 0) {
				count = storedCoupon.unMatched.length;
			} else if (storedCoupon.count) {
				count = storedCoupon.count;
			}
		} else if (ajaxData.count) {
			count = ajaxData.count;
		}
		
		var bgc = BADGE_BG_COLOR_SITE;
		if (isMat) {
			bgc = BADGE_BG_COLOR_MATCHED;
		}
		showBadge(count, bgc);
	};
	
	// Code type (popup layer), flow page
	var codeFlow = function (storedCoupon) {
		var matched = unMatched = [];
		if (typeof storedCoupon === "object") {
			if (storedCoupon.matched) matched = storedCoupon.matched;
			if (storedCoupon.unMatched) unMatched = storedCoupon.unMatched;
		} else if (ajaxData.coupon) {
			unMatched = ajaxData.coupon;
		}
		showCouponCode({"matched" : matched, "unMatched" : unMatched});
	};
	
	// Count type (shopping cart page), cart page
	var countCart = function (Data, url) {
		var count		= '';
		var isMat		= false;
		var matched		= [];
		var unMatched	= [];
		
		// Use point data
		if (Data && typeof Data === "object") {
			// Has exact coupon data
			if (Data.matched && Data.matched.length > 0) {
				matched	= Data.matched;
				count	= matched.length;
				isMat	= true;
			}
			if (Data.unMatched && Data.unMatched.length > 0) {
				unMatched	= Data.unMatched;
				count		= count ? count : unMatched.length;
			}
			if (!count && Data.count) {
				count	= Data.count;
			}
		} else {
			// Not exact data, use site coupon as unmatched
			unMatched	= ajaxData.coupon;
			count		= ajaxData.coupon.length;
		}
		
		// Show Coupon
		var bgc = BADGE_BG_COLOR_SITE;
		if (isMat) {
			bgc = BADGE_BG_COLOR_MATCHED;
		}
		showBadge(count, bgc);
		
		// Stored current matched coupon as last matched coupon
		storeLastMatchCoupon(url, {"matched": matched, "unMatched": unMatched});
	};
	
	// Count type, detail page
	var countDetail = function (response) {
		if (response.matched && response.matched.length > 0) {
//			blinkIcon(response.matched.length);
			showBadge(response.matched.length, BADGE_BG_COLOR_MATCHED);
		} else {
			showBadge(response.unMatched.length, BADGE_BG_COLOR_SITE);
		}
	};
	
	// Show coupon info in popup layer
	var showCouponCode = function (Coupon, isFillCode) {
		var hasMatchedCode		= false;
		var hasUnmatchedCode	= false;
		var index				= 0;
		var couponHtml			= "";
		var isTooLong			= false;
		var totalCodeNum		= 0;
		canFillCode				= isFillCode;
		
		if (!Coupon) Coupon = {};
		var matchedCoupon	= Coupon.matched;
		var unMatchedCoupon	= Coupon.unMatched;
		
		// Has matched coupon
		if (matchedCoupon && matchedCoupon.length > 0) {
			totalCodeNum	+= matchedCoupon.length;
			hasMatchedCode	= true;
			showBadge(matchedCoupon.length, BADGE_BG_COLOR_MATCHED);
			var extFill		= isFillCode ? "-1" : "-0";
			for(var i in matchedCoupon) {
				index++;
				if (index > PAGE_SHOW_NUM) {
					// Add to Next page coupon
					NextPageCoupon.matched.push(matchedCoupon[i]);
				} else {
					// Add to Prev page coupon
					prevPageCoupon.matched.push(matchedCoupon[i]);
					if (matchedCoupon[i].code && matchedCoupon[i].code.length > 10) isTooLong = true;
					couponHtml	+= '<div class="coupon" ext="'+ index + extFill +'" cid="'+ matchedCoupon[i].couponId +'">';
					couponHtml	+= '   <div class="couponTitle"> <a href="#">'+ matchedCoupon[i].title +'</a> </div>';
					couponHtml	+= '   <div class="couponCode red"><div class="codeL"></div><div class="codeM">'+ matchedCoupon[i].code +'</div><div class="codeR"></div></div>';
					couponHtml	+= '   <div class="cl"></div>';
					couponHtml	+= '</div>';
				}
			}
		}
		
		// Has not matched coupon
		if (unMatchedCoupon && unMatchedCoupon.length > 0) {
			totalCodeNum	+= unMatchedCoupon.length;
			hasUnmatchedCode = true;
			if (!hasMatchedCode) {
				showBadge(unMatchedCoupon.length, BADGE_BG_COLOR_SITE);
			} else {
				couponHtml	+= '<div class="line"></div>';
			}
			for(var i in unMatchedCoupon) {
				index++;
				if (index > PAGE_SHOW_NUM) {
					// Add to Next page coupon
					NextPageCoupon.unMatched.push(unMatchedCoupon[i]);
				} else {
					// Add to Prev page coupon
					prevPageCoupon.unMatched.push(unMatchedCoupon[i]);
					if (unMatchedCoupon[i].code && unMatchedCoupon[i].code.length > 10) isTooLong = true;
					couponHtml	+= '<div class="coupon" ext="'+ index + "-0" +'" cid="'+ unMatchedCoupon[i].couponId +'">';
					couponHtml	+= '   <div class="couponTitle"> <a href="#">'+ unMatchedCoupon[i].title +'</a> </div>';
					couponHtml	+= '   <div class="couponCode blue"><div class="codeL"></div><div class="codeM">'+ unMatchedCoupon[i].code +'</div><div class="codeR"></div></div>';
					couponHtml	+= '   <div class="cl"></div>';
					couponHtml	+= '</div>';
				}
			}
		}
		
		if (couponHtml) {
			// If coupon num great than 15 show next page
			if (totalCodeNum > PAGE_SHOW_NUM) {
				$(".popup").css("margin-bottom", 0);
				$("#popupPage").show();
			}
			couponHtml += '<div class="cl"></div>';
		}
		
		// Has not any coupon
		if (!hasMatchedCode && !hasUnmatchedCode) {
			hiddenBadge();
			couponHtml	= "";
		}
		
		// Set coupon info
		$(".couponlist").html(couponHtml);
		if (isTooLong) {
			$(".codeM").addClass("codeFontS");
		}
		
		// Set popup tab menu name <Current domain>
		if (Coupon.merName) {
			curDomain	= Coupon.merName;
			// If stored merchant name use it
			$(".merchantName").text(curDomain);
		} else {
			// Non stored merchant name, use current domain
			chrome.tabs.getSelected(null, function(tab){
				if (tab.url && (tab.url.indexOf("http") === 0)) {
					curDomain	= getUrlDomain(tab.url);
					$(".merchantName").text(curDomain);
				} else {
					$(".merchantName").text(curDomain);
				}
			});
		}
	};
	
	this.showPageCoupon = function(isNextPage){
		var isFillCode	= canFillCode;
		var isTooLong	= false;
		var couponHtml	= "";
		var index		= 0;
		var Coupon		= null;
		
		if (isNextPage) {
			Coupon	= NextPageCoupon;
		} else {
			Coupon	= prevPageCoupon;
		}
		
		if (!Coupon) Coupon = {};
		var matchedCoupon	= Coupon.matched;
		var unMatchedCoupon	= Coupon.unMatched;
		
		// Has matched coupon
		if (matchedCoupon && matchedCoupon.length > 0) {
			var extFill		= isFillCode ? "-1" : "-0";
			for(var i in matchedCoupon) {
				index++;
				if (matchedCoupon[i].code && matchedCoupon[i].code.length > 10) isTooLong = true;
				couponHtml	+= '<div class="coupon" ext="'+ index + extFill +'" cid="'+ matchedCoupon[i].couponId +'">';
				couponHtml	+= '   <div class="couponTitle"> <a href="#">'+ matchedCoupon[i].title +'</a> </div>';
				couponHtml	+= '   <div class="couponCode red"><div class="codeL"></div><div class="codeM">'+ matchedCoupon[i].code +'</div><div class="codeR"></div></div>';
				couponHtml	+= '   <div class="cl"></div>';
				couponHtml	+= '</div>';
			}
		}
		
		// Has not matched coupon
		if (unMatchedCoupon && unMatchedCoupon.length > 0) {
			for(var i in unMatchedCoupon) {
				index++;
				if (unMatchedCoupon[i].code && unMatchedCoupon[i].code.length > 10) isTooLong = true;
				couponHtml	+= '<div class="coupon" ext="'+ index + "-0" +'" cid="'+ unMatchedCoupon[i].couponId +'">';
				couponHtml	+= '   <div class="couponTitle"> <a href="#">'+ unMatchedCoupon[i].title +'</a> </div>';
				couponHtml	+= '   <div class="couponCode blue"><div class="codeL"></div><div class="codeM">'+ unMatchedCoupon[i].code +'</div><div class="codeR"></div></div>';
				couponHtml	+= '   <div class="cl"></div>';
				couponHtml	+= '</div>';
			}
		}
		
		if (couponHtml) {
			if (isNextPage) {
				$(".PrevNo").attr("class", "Prev");
				$(".Next").attr("class", "NextNo");
			} else {
				$(".Prev").attr("class", "PrevNo");
				$(".NextNo").attr("class", "Next");
			}
			
			couponHtml += '<div class="cl"></div>';
			
			// Set coupon info
			$(".couponlist").html(couponHtml);
			if (isTooLong) {
				$(".codeM").addClass("codeFontS");
			}
		}
	};
	
	var getStoredDomainData = function (url) {
		var curDomain = getUrlDomain(url);
		var storedData = localStorage.getItem(curDomain);
		if (storedData) {
			try {
				storedData = JSON.parse(storedData);
			} catch (e) {
				clog("JSON parse stored domain data error !!", storedData);
			}
		}
		return storedData;
	};
	
	var storeDomainData = function (url, data) {
		var curDomain = getUrlDomain(url);
		if (!curDomain) return false;
		if (data && (typeof data === "object")) {
			data = JSON.stringify(data);
		}
		localStorage.setItem(curDomain, data);
	};
	
	// Save current page (not flow page) match and unMatch coupon to localStorage
	var storeLastMatchCoupon = function (url, coupon) {
		var matched = [];
		var unMatched = ajaxData.coupon;
		var merName = "";
		if (coupon) {
			if (coupon.matched) {
				matched = coupon.matched;
			}
			if (coupon.unMatched) {
				unMatched = coupon.unMatched;
			}
			if (coupon.merName) {
				merName = coupon.merName;
			}
		}
		
		var lastMatched = {
			"url" : url,
			"count" : ajaxData.count,
			"pageType": ajaxData.pageType,
			"pageRegular": ajaxData.pageRegular,
			"matched" : matched,
			"unMatched" : unMatched,
			"merName" : merName
		};
		
		// If current domain data has exist, update lastMatched data, else create it
		var domainData = getStoredDomainData(url);
		if (domainData && (typeof domainData === "object")) {
			domainData.lastMatched = lastMatched;
		} else {
			domainData = {"lastMatched" : lastMatched};
		}
		
		storeDomainData(url, domainData);
		clog("Store last matched coupon", lastMatched);
	};
	
	// Get Last page match and unMatch coupon to localStorage
	var getLastMatchCoupon = function (url) {
		var lastMatched = null;
		var domainData = getStoredDomainData(url);
		if (domainData && domainData.lastMatched) {
			lastMatched = domainData.lastMatched;
		}
		return lastMatched;
	};
	
	// Store current page regular
	var	storePageRegular = function (url, pageRegular) {
		var domainData = getStoredDomainData(url);
		
		// If current domain data has exist, update curPageRegular data, else create it
		if (domainData && (typeof domainData === "object")) {
			domainData.curPageRegular = pageRegular;
		} else {
			domainData = {"curPageRegular" : pageRegular};
		}
		
		storeDomainData(url, domainData);
		clog("Store page regular", pageRegular);
	};
	
	// Get Stored current page regular
	var	getStorePageRegular = function (url) {
		var pageRegular = null;
		var domainData = getStoredDomainData(url);
		if (domainData && domainData.curPageRegular) {
			pageRegular = domainData.curPageRegular;
		}
		return pageRegular;
	};
	
	// Store current product matched coupon
	var	storeProdCoupon = function(url, domRes) {
		if (domRes && domRes.prodName && domRes.matched && domRes.matched.length > 0) {
			var Da = getStoredDomainData(url);		// Stored all data
			var pDa = [];							// Stored product coupon data
			var prodCoupon = domRes.matched;
			var pName = $.trim(domRes.prodName);
			
			if (!Da) Da = {};
			if (Da.product) {
				pDa = Da.product;
			}
			
			// If has stored current product coupon delete it
			if (pDa.length > 0) {
				for (var i = 0; i < pDa.length; i++) {
					if (pDa[i].prodName == pName) {
						pDa.splice(i, 1);
						i--;
					}
				}
			}
			
			// Add product name to coupon
			for(var i in prodCoupon) {
				prodCoupon[i].prodName = pName;
			}
			
			// Add product coupon to product store
			pDa = pDa.concat(prodCoupon);
			
			// Store product page coupon
			Da.product = pDa;
			storeDomainData(url, Da);
			clog("Store product matched coupon, <prodName>:" + pName, Da);
		}
	};
	
	// Get stored product coupon
	var getProdCoupon = function(url) {
		var Da = getStoredDomainData(url);		// Stored all data
		var pDa = null;						// Stored product data
		
		if (Da && Da.product) {
			pDa = Da.product;
		}
		
		return pDa;
	};
	
	// Delete expire product coupon
	var delProdExripCoupon = function(url, codeArr) {
		if (!url || !codeArr || codeArr.length < 1) {
			return ;
		}
		
		var Da = getStoredDomainData(url);		// Stored all data
		var pDa = [];							// Stored product coupon data
		
		if (!Da || !Da.product || Da.product.length < 1) {
			return ;
		}
		pDa = Da.product;
		
		// If has stored current product coupon delete it
		for (var i = 0; i < pDa.length; i++) {
			for (var j in codeArr) {
				if (pDa[i].code == codeArr[j]) {
					pDa.splice(i, 1);
					i--;
				}
			}
		}
		
		Da.product = pDa;
		storeDomainData(url, Da);
		clog("Restore product matched coupon, <after remove expire coupon>:");
	};

	var formatErrorXpath = function(errorXpath){
		var errorArr	= [];
		if (errorXpath && errorXpath.length > 0) {
			switch(typeof errorXpath) {
				case "string":
					errorArr.push({"xpath":errorXpath, "id":0});
					break;
				case "object":
					for (var i in errorXpath) {
						switch(typeof errorXpath[i]) {
							case "string":
								errorArr.push({"xpath":errorXpath[i], "id":0});
								break;
							case "object":
								errorArr.push(errorXpath[i]);
								break;
						}
					}
					break;
			}
		}
		return errorArr;
	};
};

// Append Response obj to window
window.Response = new Response();

})();