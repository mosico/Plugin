var Content	= new Content();

chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
	var responseJson	= {};
	
	// Fill coupon code to input xpath
	if (Request.pageType === PT_FILL_CODE) {
		var retCode		= XPATH_SUCCESS;
		var errorXpath	= [];
		
		if (Request.inputXpath && Request.inputXpath.length > 0 && Request.code) {
			var xpathArr = Request.inputXpath;
			// Fill coupon code to input box
			for(var i in xpathArr) {
				try {
					var iterator = document.evaluate(xpathArr[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
					var node = iterator.iterateNext();
					if (node) {
						node.setAttribute("value", Request.code);
						clog("Get coupon code input, <name>: " + node.getAttribute("name"));
						clog("Input xpath: " + xpathArr[i]);
						clog("Coupon code: " + Request.code);
						break;
					} else {
						retCode	= XPATH_ERROR;
						errorXpath.push(xpathArr[i]);
						clog("Not get coupon code input name");
						clog("Input xpath: " + xpathArr[i]);
					}
				} catch (e) {
					retCode	= XPATH_ERROR;
					errorXpath.push(xpathArr[i]);
					clog('Match code input box error !!', e);
				}
			}
		}
		
		responseJson = {"retCode" : retCode, "error": errorXpath};
	}
	
	// Append search keyword refer merchant coupon info to search result end
	if (Request.pageType === PT_SEARCH_APPEND_MERNUM) {
		var errorXpath	= [];
		var className	= "cmusGogle";
		var tabUrl		= Request.tabUrl.toLowerCase();
		if (tabUrl.indexOf("google.com") > 0) {
			className	= "cmusGogle";
		} else if (tabUrl.indexOf("bing.com") > 0) {
			className	= "cmusBing";
		} else if (tabUrl.indexOf("yahoo.com") > 0) {
			className	= "cmusYahoo";
		}
		
		if (Request.xpathArr && Request.xpathArr[3] && Request.count > 0) {
			var xpath = Request.xpathArr[3];
			try {
				var iterator = document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var node = iterator.iterateNext();
				if (node) {
					var cmusObj	= document.getElementById("cmus");
					if (!cmusObj) {
						// Create span
						var infoSpan	= document.createElement("span");
						infoSpan.setAttribute("id", "cmus");
						var innerHtml	= '<span class="'+ className +'">';
						innerHtml		+= '<span class="keyword">'+ Request.merName +'</span> has ';
						innerHtml		+= '<img src="'+ Request.numUrl +'" valign="top" border="0" />';
						innerHtml		+= '</span> on <a href="'+ Request.merUrl +'" target="_blank">couponmountain.com</a>';
						innerHtml		+= '</span>';
						infoSpan.innerHTML	= innerHtml;
						// Append to search result
						node.appendChild(infoSpan);
						clog("Get search result div. xpath: " + xpath);
					} else {
						clog("Search result refer coupon div already exist !!");
					}
				} else {
					errorXpath.push(xpath);
					clog("Not search result div !!");
					clog("Append result div xpath: " + xpath);
				}
			} catch (e) {
				errorXpath.push(xpath);
				clog('Match search total result div error !!', e);
			}
		}
		
		responseJson = {"error": errorXpath};
	}
	
	
	// Append coupon to search engin result
	if (Request.pageType === PT_SEARCH_APPEND_COUPON) {
		responseJson = {"retCode": XPATH_DEFAULT, "error": []};
		if (Request.couponArr && Request.couponArr.length > 0) {
			responseJson = Content.appendSeCoupon(Request.xpathArr, Request.couponArr, Request.tabUrl);
		}
	}
	
	
	// Auto Push merchant updated coupons
	if (Request.pageType === PT_PUSH_MERCHANT_COUPON) {
		responseJson.retCode	= -1;
		var hasAppend = false;
		var childNodes = document.body.childNodes;
		if (childNodes.length > 0) {
			for (var n in childNodes) {
				if (childNodes[n].id == "cmusPush") {
					hasAppend = true;
				}
			}
		}
		
		if (!hasAppend) {
			responseJson.retCode	= 0;
			var pushDiv	= document.createElement("div");
			pushDiv.setAttribute("id", "cmusPush");
			var html = "";
			
			html += '<div class="popTop">';
			html += '	<div class="popTitle">COUPON DAILY PUSH</div>';
			html += '	<div class="popBtn"><span val="min">▬</span><span val="max">□</span><span val="close">×</span></div>';
			html += '</div>';
			html += '<div class="clearBoth"></div>';
			html += '<div class="popContent">';
			
			for (var i in Request.data) {
				var curMer	= Request.data[i];
				
				html += '	<div class="merCoup">';
				html += '		<dl>';
				html += '			<dt><span class="merName">'+ curMer.merName +'</span> updated coupon(s):</dt>';
				for (var j in curMer.coupon) {
					var curCoup	= curMer.coupon[j];
					var curSave	= curCoup.save ? " ("+ curCoup.save +")" : "";
					var curTit	= curCoup.title + curSave;
					if (curCoup.link && curCoup.link.length > 0) {
						// Title has link
						curTit	= '<a href="' + curCoup.link + '" target="_blank">' + curTit + '</a>';
					}
					html += '			<dd>'+ curTit +' : '+ curCoup.code +'</dd>';
				}
				html += '		</dl>';
				html += '	</div>';
			}
			
			html += '</div>';
			
			pushDiv.innerHTML = html;
			document.body.appendChild(pushDiv);
		}
	}
	
	sendResponse(responseJson);
});


chrome.extension.onConnect.addListener(function(Port){
	// Receive message
	Port.onMessage.addListener(function(Msg) {
		var tabUrl		= Msg.tabUrl;
		var isLoaded	= (document.readyState === "complete") ? true : false;
		
		// Detail page <On line>
		if (Msg.pageType === PT_DETAIL_PAGE && Msg.matchType === MT_ON_LINE && Msg.couponArr.length > 0) {
			var retCode		= XPATH_DEFAULT;
			var matched		= [];
			var unMatched	= [];
			var errorArr	= [];
			var prodName	= "";
			
			// Get product name and add it to response data
			pNames = Content.getProdName(Msg.pageRegular.itemXpath);
			if (pNames && pNames.length > 0) {
				prodName	= pNames[0];
				retCode		= XPATH_SUCCESS;
			} else if (isLoaded) {
				retCode		= XPATH_DOM_COMPLETE;
				errorArr	= Msg.pageRegular.itemXpath;
			} else {
				retCode	= XPATH_DOM_LOADING;
			}
			
			// If get dom element match couopon
			if (retCode === XPATH_SUCCESS) {
				var matchResult	= Content.detailPageMatch(Msg.couponArr, tabUrl);
				retCode		= matchResult.retCode;
				matched		= matchResult.matched;
				unMatched	= matchResult.unMatched;
				if (matchResult.error && matchResult.error.length > 0) {
					errorArr	= matchResult.error;
				}
			}
			
			Port.postMessage({"retCode": retCode, "matched": matched, "unMatched": unMatched, "prodName": prodName, "error": errorArr});
		}
		
		
		// Off line match detail page, get product name
		if (Msg.pageType === PT_DETAIL_PAGE && Msg.matchType === MT_OFF_LINE) {
			var retCode		= XPATH_DEFAULT;
			var errorArr	= [];
			var prodName	= "";
			if (Msg.pageRegular && Msg.pageRegular.itemXpath && Msg.pageRegular.itemXpath.length > 0) {
				var pn = Content.getProdName(Msg.pageRegular.itemXpath);
				if (pn && pn.length > 0) {
					retCode		= XPATH_SUCCESS;
					prodName	= pn[0];
				} else if (isLoaded) {
					retCode		= XPATH_DOM_COMPLETE;
					errorArr	= Msg.pageRegular.itemXpath;
				} else {
					retCode	= XPATH_DOM_LOADING;
				}
			} else {
				retCode	= XPATH_ERROR;
			}
			
			Port.postMessage({"retCode": retCode, "prodName": prodName, "error": errorArr});
		}
		
		
		// Search engin page
		if (Msg.pageType === PT_SEARCH_ENGINE_PAGE) {
			var retCode		= XPATH_DEFAULT;
			var errorArr	= [];
			var resXpath	= [];
			var resItemUrl	= [];
			var resKeyword	= "";
			
			
			if (Msg.xpath && Msg.xpath.length > 0) {
				resXpath = Msg.xpath;
				// Get search item url<domain>
				var itemUrl = Content.getSeItemUrl(Msg.xpath[0]);
				if (itemUrl && itemUrl.length > 0) {
					retCode	= XPATH_SUCCESS;
					resItemUrl = itemUrl;
				} else if (isLoaded) {
					retCode	= XPATH_DOM_COMPLETE;
					errorArr.push(Msg.xpath[0]);
				} else {
					retCode	= XPATH_DOM_LOADING;
				}
				// Get search keyword
				var kwXpath = Msg.xpath[2];
				if (kwXpath && kwXpath.length > 0 && (retCode === XPATH_SUCCESS)) {
					try {
						var iterator = document.evaluate(kwXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
						var node = iterator.iterateNext();
						clog("Search keyword xpath: " + kwXpath);
						if (node) {
							var kw = node.value;
							resKeyword = kw;
							clog("Search keyword: " + kw);
						} else {
//							retCode	= XPATH_ERROR;
							errorArr.push(kwXpath);
						}
					} catch (e) {
//						retCode	= XPATH_ERROR;
						errorArr.push(kwXpath);
						clog('Get search keyword error!!', e);
					}
				}
			} else {
				// Xpath error
				retCode	= XPATH_ERROR;
			}
			
			// Respond object
			Port.postMessage({"retCode": retCode, "xpath": resXpath, "itemUrl": resItemUrl, "keyword": resKeyword, "error": errorArr});
		}
		
		
		// Shopping cart page, get item product name
		if (Msg.pageType === PT_CART_PAGE) {
			var retCode		= XPATH_DEFAULT;
			var errorArr	= [];
			var prodNames	= [];
			var names = Content.getProdName(Msg.xpath);
			if (names && names.length > 0) {
				prodNames = names;
				retCode	= XPATH_SUCCESS;
			} else if (isLoaded) {
				retCode		= XPATH_DOM_COMPLETE;
				errorArr	= Msg.xpath;
			} else {
				retCode	= XPATH_DOM_LOADING;
			}
			
			Port.postMessage({"retCode": retCode, "prodNames": prodNames, "error": errorArr});
		}
		
	});
});



// Deal detail logic function/class
function Content() {
	
	// Get detail page or shopping cat page 's product(item) name
	// Return a product name array
	this.getProdName = function(xpath) {
		var xpathArr = [];
		var nameArr = [];
		if (!xpath) {
			return nameArr;
		}
		
		if (typeof xpath === "string") {
			xpathArr.push(xpath);
		} else {
			xpathArr = xpath;
		}
		
		for (var i in xpathArr) {
			try {
				var iterator = document.evaluate(xpathArr[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var node = iterator.iterateNext();
				if (node) {
					while (node) {
						var name = node.textContent;
						name	 = name.replace(/\r|\n|\t/g, '');
						name	 = name.replace(/\s+/g, ' ');
						nameArr.push(name);
						node = iterator.iterateNext();
						clog(name);
					}
				} else {
					clog("Not get product name", "Item xpath: " + xpathArr[i]);
				}
			} catch (e) {
				clog('Get product name error !!', "Item xpath: " + xpathArr[i], e);
			}
		}
		
		return nameArr;
	};
	
	
	// Detail/Product page match coupon <On line match>
	this.detailPageMatch = function(couponArr, tabUrl){
		var matched		= [];
		var unMatched	= [];
		var retCode		= XPATH_SUCCESS;
		var errorArr	= [];
		
		// Match each coupon with regex , if not have regex add to unMatched array
		for (var i in couponArr) {
			var isMatched = false;
			var coupon = couponArr[i];
			// Coupon has regex
			if (coupon.regular.length > 0) {
				for (var j in coupon.regular) {
					var eachRegex = coupon.regular[j];
					try {
						var regPatt = new RegExp(eachRegex.regex, "i");
						clog(regPatt);
						// Regular match url
						if (eachRegex.matchType == "url") {
							clog(tabUrl);
							// Matched current coupn with tab url
							if (regPatt.test(tabUrl)) {
								isMatched = true;
							} else {
								isMatched	= false;
								break;
							}
						// Regular match dom
						} else if (eachRegex.matchType == "xpath") {
							var nodeText	= '';
							// Get node text
							var iterator = document.evaluate(eachRegex.xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
							var node = iterator.iterateNext();

							// Not get node, xpath error
							if (!node) {
								retCode		= XPATH_ERROR;
								//errorArr.push("couponCode:"+coupon.code+" --- xpath:"+eachRegex.xpath);
								errorArr.push({xpath:eachRegex.xpath, id:coupon.id});
							}
							
							while (node) {
								nodeText	+= node.textContent;
								node		= iterator.iterateNext();
							}
							// Trim node text
							nodeText	= nodeText.replace(/\s+/g, '');
							clog("NodeText: " + nodeText);
							// Matched current coupn with dom xpath
							if (regPatt.test(nodeText)) {
								isMatched	= true;
							} else {
								isMatched	= false;
								break;
							}
							
							clog(eachRegex.xpath, nodeText);
						}
					} catch (e) {
						clog('Match detail page regex error !!', e);
						if (eachRegex.matchType == "xpath") {
							retCode	= XPATH_ERROR;
							//errorArr.push("couponCode:"+coupon.code+" --- xpath:"+eachRegex.xpath);
							errorArr.push({xpath:eachRegex.xpath, id:coupon.id});
						}
						break;
					}
				}
			}
			// If regex matched add to matched array, else add to unMatched array
			if (isMatched) {
				matched.push(coupon);
			} else {
				unMatched.push(coupon);
			}
		}
		
		return {"retCode": retCode, "matched": matched, "unMatched": unMatched, "error": errorArr};
	};
	
	
	this.getSeItemUrl = function(xpath) {
		var itemUrlArr = [];
		
		try {
			var iterator = document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();
			clog("Item url<domain> xpath: " + xpath);
			if (node) {
				while (node) {
					var itemUrl = node.innerText;
					itemUrl		= itemUrl.replace(/\s+/g, '');
					itemUrlArr.push(itemUrl);
					node = iterator.iterateNext();
					clog("Get search result item, <URL>: " + itemUrl);
				}
			} else {
				clog("Not get search result item <getURL>");
			}
		} catch (e) {
			clog('Match search engine page result error <getURL> !!', e);
		}
		
		return itemUrlArr;
	};
	
	
	this.appendSeCoupon = function(xpathArr, couponArr, tabUrl) {
		var urlArr		= titleNodeArr = [];
		var retCode		= XPATH_SUCCESS;
		var errorXpath	= [];
		var isGoogle	= false;
//		if (tabUrl.indexOf("google.com") > 0) {
//			isGoogle	= true;
//		}
		
		// Get all cite<domain> url
		urlArr = this.getSeItemUrl(xpathArr[0]);
		if (!urlArr || urlArr.length < 1) {
			retCode	= XPATH_ERROR;
			errorXpath.push(xpathArr[0]);
			return {"retCode": retCode, "error": errorXpath};
		}
		
		// Get all item title node 
		try {
			var iterator = document.evaluate(xpathArr[1], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();
			clog("Item title xpath: " + xpathArr[1]);
			if (node) {
				while (node) {
					titleNodeArr.push(node);
					node = iterator.iterateNext();
				}
			} else {
				retCode	= XPATH_ERROR;
				errorXpath.push(xpathArr[1]);
			}
		} catch (e) {
			retCode	= XPATH_ERROR;
			errorXpath.push(xpathArr[1]);
			clog('Get search item title node error <set coupon>!!', e);
		}
		if (!titleNodeArr || titleNodeArr.length < 1) {
			return {"retCode": retCode, "error": errorXpath};
		}
		
		for (var i in urlArr) {
			try {
				var itemUrl = urlArr[i];
				clog(itemUrl);
				if (!itemUrl) {
					continue;
				}
				for (var j in couponArr) {
					if (couponArr[j].count > 0 && itemUrl == couponArr[j].url) {
						var hasOmit		= false;
						clog("Matched url :" + itemUrl + ' -- count:' + couponArr[j].count);
						// If already appended coupon number to item title, don't append again
						var hasAppend = false;
						var childNodes = titleNodeArr[i].childNodes;
						if (childNodes.length > 0) {
							for (var n in childNodes) {
								if (isGoogle && /\.\.\.\s*$/.test(childNodes[n].innerText)){
									hasOmit	= true;
								}
								if (childNodes[n].name == "cmus" || (isGoogle && childNodes[n].nodeName == "SPAN")) {
									hasAppend = true;
								}
							}
						} else {
							// Appended element is not exist, or is empty, refuse append
							break;
						}
						if (!hasAppend) {
							// Span tag
							var newSpan	= document.createElement("span");
							newSpan.setAttribute("name", "cmus");
							if (isGoogle && hasOmit) newSpan.setAttribute("style", "float:right;");
							// A tag
							var newA = document.createElement("a");
							newA.setAttribute("name", "cmus");
							newA.setAttribute("href", couponArr[j].link);
							newA.setAttribute("target", "_blank");
							// Img tag
							var newImg = document.createElement("img");
							newImg.setAttribute("src", couponArr[j].img);
							newImg.setAttribute("style", "margin-bottom: -4px; margin-left: 5px; border: 0px;");
							// Append img tag to a tag; Append a tag to span tag
							newA.appendChild(newImg);
							newSpan.appendChild(newA);
							// Add non overflow to parent css style
							var style = titleNodeArr[i].getAttribute("style");
							if (style) {
								style += ";overflow: visible;";
							} else {
								style = "overflow: visible;";
							}
							titleNodeArr[i].setAttribute("style", style);
							if (hasOmit) {
								titleNodeArr[i].appendChild(newSpan);
							} else {
								titleNodeArr[i].appendChild(newA);
							}
							break;
						}
					}
				}
			} catch (e) {
				clog("Append coupon to search item error !!", e);
			}
		}
		
		return {"retCode": retCode, "error": errorXpath};
	};
	
}

