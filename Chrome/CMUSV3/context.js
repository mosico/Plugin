/**
 * Make sure don't remove this block <comment>
 * CMUS-Coupon-Digger content page JS
 */

var loopHandle	= null;
var loopTimes	= 0;
var Context	= {
	reqData: null,
	applyInfo: null,
	isInject: false,
	hasRegex: false,
	hasAppendDom: false,
	intervalTime: 4000,
	applyType: 'REFLASH',
	removeDom: null,
	
	init: function() {
		var loopWaitHandle	= null;
		doStarting();
		
		function doStarting() {
			if (Mix.empty(Context.reqData)) {
				loopWaitHandle	= setTimeout(doStarting, 200);
				return ;
			}
			clearTimeout(loopWaitHandle);
			
			// If Don't has pageRegular attribute, set it
			if (!Context.reqData.pageRegular) Context.reqData.pageRegular = {};
			
			Context.initApplyInfo();
//			switch (Context.reqData.domain) {
//				case "target.com":
//					Context.initTargetXpath();
//					break;
//				case "dell.com":
//					Context.initDellXpath();
//					break;
//				case "torrid.com":
//					Context.initTorridXpath();
//					break;
//				case "drugstore.com":
//					Context.initDrugstoreXpath();
//					break;
//				default:
//					return ;
//					break;
//			}
			
			if (Context.checkRegular()) {
				var intvTime	= Context.reqData.pageRegular.intervalTime;
				var applyType	= Context.reqData.pageRegular.applyType;
				if (intvTime > 0) Context.intervalTime	= intvTime * 1000;
				if (applyType != 'REFLASH') Context.applyType	= applyType;
				Context.injectDom().autoCheck();
			} else {
				Mix.log("Regular xpaths are not supply or don't match!!");
			}
		}
	},
	
	getRemoveDom: function() {
		var dom	= null;
		
		if (Context.reqData.domain == 'lampsplus.com') {
			Context.reqData.pageRegular.removeXpath	= '//input[@id="btnRemovePromoCode"]';
		}
		
		var removeXpath	= Context.reqData.pageRegular.removeXpath;
		if (!Mix.empty(removeXpath)) {
			switch (typeof removeXpath) {
				case 'string':
					dom	= Context.getXpathDom(removeXpath);
					break;
				case 'object':
					for (var i in removeXpath) {
						var xpath	= removeXpath[i];
						if (Mix.empty(xpath)) continue;
						dom	= Context.getXpathDom(xpath);
						if (!dom) continue;
					}
					break;
				default:
					break;
			}
		}
		
		return dom;
	},
	
	checkRegular: function() {
		var result	= false;
		if (Context.reqData.pageRegular) {
			var Regu	= Context.reqData.pageRegular;
			if (!Mix.empty(Regu.inputXpath, true) && !Mix.empty(Regu.submitXpath, true) && !Mix.empty(Regu.priceXpath, true)) {
				if (Context.getXpathDom(Regu.inputXpath) &&
					Context.getXpathDom(Regu.submitXpath) &&
					Context.getXpathDom(Regu.priceXpath)) {
					Context.hasRegex	= true;
					result	= true;
				}
			}
		}
		if (!result) {
			var removeDom	= Context.getRemoveDom();
			if (removeDom) {
				Context.removeDom	= removeDom;
				result	= true;
			}
		}
		
		return result;
	},
	
//	checkRegular: function() {
//		var result	= false;
//		if (Context.reqData.pageRegular) {
//			var Regu	= Context.reqData.pageRegular;
//			if (!Mix.empty(Regu.inputXpath, true) &&
//				!Mix.empty(Regu.submitXpath, true) &&
////				!Mix.empty(Regu.appendXpath, true) &&
//				!Mix.empty(Regu.priceXpath, true)) {
//				Context.hasRegex	= true;
//				result	= true;
//			}
//		}
//		return result;
//	},
	
	clearOnBreak: function() {
		var prevIndex	= Context.applyInfo.codeIndex;
		var checkingHandle	= window.setTimeout(function(){
			var status	= Context.applyInfo.status;
			var curIndex	= Context.applyInfo.codeIndex;
			if (status == "checking" && curIndex == prevIndex) {
				window.clearInterval(checkingHandle);
				Context.clearApplyInfo();
			} else if (status == "start" || status == "finish") {
				window.clearInterval(checkingHandle);
			} else {
				prevIndex	= curIndex;
			}
		}, 10000);
	},
	
	initApplyInfo: function() {
		var count	= Context.reqData.count > 0 ? Context.reqData.count : 0;
		Context.applyInfo	= {count: count, codeIndex: 0, domain: "", status: "start", isApply: false, applyCode: '',
				originalPrice: 0, finalPrice: 0, discount: 0, symbol: '', useInfo: []};
	},
	
	initTargetXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="promoCode"]'];
		Context.reqData.pageRegular.submitXpath	= ['//button[@class="button tier-2 applyButton"]'];
//		Context.reqData.pageRegular.appendXpath	= ['//div[@class="input-field"]'];
		Context.reqData.pageRegular.priceXpath	= ['//li[@id="final-price"]/span[@class="subtotalLabel-price"]'];
		Context.reqData.pageRegular.discountXpath	= ['//span[@class="dprice"]'];
		Context.reqData.intervalTime	= 2000;
		Context.reqData.applyType		= VERIFY_TYPE_REFLASH;
	},
	
	initDellXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="basketCoupons_manual_coupon_code"]'];
		Context.reqData.pageRegular.submitXpath	= ['//a[@testid="basketCoupons_InternalLink2"]'];
//		Context.reqData.pageRegular.appendXpath	= ['//input[@id="basketCoupons_manual_coupon_code"]/..'];
		Context.reqData.pageRegular.priceXpath	= ['//span[@id="basketItems__CartItemsRepeater__item_0_0"]//td/span[@class="price_text_bold"]'];
		Context.reqData.intervalTime	= 2000;
		Context.reqData.applyType		= VERIFY_TYPE_REFLASH;
	},
	
	initTorridXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="promoCodeInput"]'];
		Context.reqData.pageRegular.submitXpath	= ['//input[@id="promoBtn"]'];
		Context.reqData.pageRegular.appendXpath	= ['//div[@id="orderHeader"]'];
		Context.reqData.pageRegular.priceXpath	= ['//div[@id="totAmt"]'];
		Context.reqData.pageRegular.discountXpath	= ['//div[@id="promoAmt"]'];
		Context.reqData.intervalTime	= 4000;
		Context.reqData.applyType		= VERIFY_TYPE_AJAX;
	},
	
	initDrugstoreXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="applyCoupon"]'];
		Context.reqData.pageRegular.submitXpath	= ['//input[@id="btnApplyCoupon"]'];
//		Context.reqData.pageRegular.appendXpath	= ['//div[@id="h-f-2col-innerbody-wrapper"]/div[@class="h-f-2col-main"]/div[@class="h-f-2col-right"]'];
		Context.reqData.pageRegular.priceXpath	= ['//div[@id="bag-totals"]//td[@class="bagtotalretailamount"]'];
		Context.reqData.intervalTime	= 4000;
		Context.reqData.applyType		= VERIFY_TYPE_REFLASH;
	},
	
	execute: function() {
		Animate.hideMain();
		var Data	= Context.reqData;
		
		var removeDom	= Context.removeDom;
		var Regular		= Data.pageRegular;
		var maxLoopTimes	= Data.count;
		var prevCodeIndex	= 0;
		loopTimes		= Context.applyInfo.codeIndex + 1;
		loopTry();
		Context.clearOnBreak();
		function loopTry() {
			var price	= Context.getPrice(Regular.priceXpath);
			Context.applyInfo.finalPrice	= price;
//			var minPrice	= Context.applyInfo.finalPrice;
//			Context.applyInfo.finalPrice	= minPrice > 0 ? Math.min(minPrice, price) : price;
			prevCodeIndex	= loopTimes - 2;
			if (prevCodeIndex >= 0 && prevCodeIndex < maxLoopTimes) {
				var prevPrice	= loopTimes > 2 ? Context.applyInfo.useInfo[loopTimes - 3].price : Context.applyInfo.originalPrice;
				if (!Context.applyInfo.useInfo[prevCodeIndex].isRemove) {
					Context.applyInfo.useInfo[prevCodeIndex].price	= price;
					Context.applyInfo.useInfo[prevCodeIndex].reduce	= Context.getReduce(prevPrice, price);
				}
			}
			
			if (loopTimes == 1) {
				Context.applyInfo.originalPrice	= price;
			} else if (loopTimes > maxLoopTimes) {
				// Apply the max discount code
				var reduce	= Context.getReduce(Context.applyInfo.originalPrice, Context.applyInfo.finalPrice);
				var applyCode	= Context.applyInfo.applyCode;
				if (reduce > 0 && !Context.applyInfo.isApply) {
					try {
						applyCode	= Context.sortCode(Context.applyInfo.useInfo)[0].code;
					} catch (e) {
						Mix.log("Sort coupon code fail", e);
					}
				}
				if (applyCode && prevCodeIndex < maxLoopTimes) {
					// Remove code
					if (removeDom) {
						Context.applyInfo.useInfo[prevCodeIndex].isRemove	= true;
						Context.saveApplyInfo({codeIndex: prevCodeIndex, applyCode: applyCode});
						$(removeDom).trigger('click');
						Animate.showApply();
						return;
					} else {
						Context.saveApplyInfo({isApply: true, applyCode: applyCode});
						Animate.showApply();
						Context.applyCode(applyCode, Regular.inputXpath, Regular.submitXpath, loopTry);
						return;
					}
				}
				
				clearTimeout(loopHandle);
				// get final total price, add do some log or output snme message
				var discount	= Context.getPrice(Regular.discountXpath);
				Context.saveApplyInfo({finalPrice: price, status: "finish", discount: discount});
				Animate.showResult();
				return ;
			}
			
			var curCoupon	= Data.coupon[loopTimes - 1];
			
			// Remove code
			if (removeDom) {
				if (prevCodeIndex >= 0) {
					Context.applyInfo.useInfo[prevCodeIndex].isRemove	= true;
				} else if (typeof Context.applyInfo.useInfo[0] == "object") {
					Context.applyInfo.useInfo[0].isRemove	= true;
				}
				$(removeDom).trigger('click');
				Context.saveApplyInfo({codeIndex: prevCodeIndex, status: "checking", domain: Data.domain});
				Animate.showProcess();
				return ;
			} else {
				Context.applyInfo.useInfo.push({couponId: curCoupon.couponId, code: curCoupon.code, price: price, reduce: 0, isRemove: false});
				Context.saveApplyInfo({codeIndex: loopTimes - 1, status: "checking", domain: Data.domain});
				Animate.showProcess();
				Context.applyCode(curCoupon.code, Regular.inputXpath, Regular.submitXpath, loopTry);
			}
		}
	},
	
	applyCode: function(code, inputXpath, submitXpath, loopFun) {
		$(Context.getXpathDom(inputXpath)).val(code);
		var submitDom	= Context.getXpathDom(submitXpath);
		$(submitDom).trigger('click');
		Context.execHrefJs($(submitDom).attr("href"));	// Fix doesn't execute href js
		
		loopTimes++;
		
		if (Context.applyType	== VERIFY_TYPE_AJAX) {
			loopHandle	= setTimeout(loopFun, Context.intervalTime);
		}
	},
	
	// Fix onclick event (like dell cart apply)
	execHrefJs: function(href) {
		if (Mix.empty(href, true)) return ;
		
		href	= href.replace(/\s|\r|\n|\t/g, '');
		if (href.indexOf('http') != -1 || href.indexOf('javascript:void') == 0 
			|| href.indexOf('javascript:;') == 0 || href.indexOf('javascript:(') == 0) {
			return ;
		}
		href	= href.replace("javascript:", '');
		setTimeout(function(){
			var execScript = document.createElement("script");
			execScript.type = "text/javascript";
			execScript.text = href;
			document.body.appendChild(execScript);
		}, 500);
	},
	
	// If is running apply/check coupon code, auto click apply button
	autoCheck: function() {
		if (!Context.isInject) return ;
		
		Context.getApplyInfo(function(applyInfo){
			if (!applyInfo.status || applyInfo.domain != Context.reqData.domain) {
				// applyInfo.status != 'checking' &&
				if (applyInfo.status != 'checking' && Context.applyInfo.status == 'start' && !Context.hasAppendDom) {
					Animate.showMain();
				}
				return ;
			}
			
			var curCodeIndex	= parseInt(applyInfo.codeIndex) + 1;
			applyInfo.codeIndex = curCodeIndex;
			Context.applyInfo	= applyInfo;
			
			if (applyInfo.status == 'checking') { 
				if (applyInfo.codeIndex < applyInfo.count) {
					Animate.showProcess();
				}
				setTimeout(Context.execute, 1000);
			} else if (applyInfo.status == 'finish') {
				Animate.showResult();
			}
		});
	},
	
	injectDom: function() {
		if (Mix.empty(Context.reqData) || Context.reqData.count < 1) {
			Mix.log("Doesn't has coupon data, stop inject plugin dom !!", Context.reqData);
			return this;
		}
		
//		// If don't get code input box, stop inject
//		var inputDom	= Context.getXpathDom(Context.reqData.pageRegular.inputXpath);
//		if (!inputDom) return this;
		
		$("body").append(Html.getPopup());
		Context.isInject	= true;
		var appendDom		= Context.getXpathDom(Context.reqData.pageRegular.appendXpath);
		
		// If don't get appendXpath refer's dom, stop execute 
		if (!appendDom) {
			Context.hasAppendDom	= false;
			$("body").append(Html.getMain());
		} else {
			Context.hasAppendDom	= true;
			$(appendDom).append(Html.getBtn());
		}
		
		return this;
	},
	
	getXpathText: function(xpath) {
		var textArr	= [];
		try {
			var iterator	= document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();
			if (node) {
				while (node) {
					var text	= node.textContent;
					text		= text.replace(/\r|\n|\t/g, '');
					text		= $.trim(text);
					textArr.push(text);
					node = iterator.iterateNext();
				}
			} else {
				Mix.log("Not get xpath refer value, xpath: " + xpath);
			}
		} catch (e) {
			Mix.log("Get text/value fail, evaluate error :", xpath, e);
		}
		return textArr;
	},
	
	getXpathDom: function(xpath) {
		var node	= null;
		if (Mix.empty(xpath)) {
			Mix.log("Xpath is empty, stop get xpath refer dom !!");
			return node;
		}
		
		if (typeof xpath == "string"){
			// appendXpath is a string
			try {
				node	= document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
			} catch (e) {
				Mix.log("Get dom fail, evaluate error :", xpath, e);
			}
		} else {
			// appendXpath is an array
			for (var i in xpath) {
				if (Mix.empty(xpath[i])) continue;
				try {
					node	= document.evaluate(xpath[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
				} catch (e) {
					Mix.log("Get dom fail, evaluate error :", xpath, e);
				}
				if (node) break;
			}
		}
		
		if (!node) {
			node	= null;
			Mix.log("Not get xpath refer dom/node, xpath: ", xpath);
		}
		
		return node;
	},
	
	sendRequest: function(Data, callback) {
		Data.tabUrl	= Context.reqData.url;
		Data.tabId	= Context.reqData.tabId;
		chrome.extension.sendRequest(Data, function(Res){
			if (typeof callback == "function") {
				callback(Res);
			}
		});
	},
	
	saveApplyInfo: function(modifyInfo) {
		var info	= $.extend(Context.applyInfo, modifyInfo);
		Context.applyInfo	= info;
		Context.sendRequest({reqType: 'storeApplyInfo', info: info});
	},
	getApplyInfo: function(callback) {
		Context.sendRequest({reqType: 'getApplyInfo'}, callback);
	},
	clearApplyInfo: function() {
		Context.sendRequest({reqType: 'storeApplyInfo', info: {}});
		Context.initApplyInfo();
	},
	
	getPrice: function(xpath) {
		var price	= 0;
		if (Mix.empty(xpath)) {
			Mix.log("Price xpath is empty");
			return price;
		}
		
		if (typeof xpath == "string") {
			price	= Context.countNumArr(Context.getXpathText(xpath));
		} else {
			for (var i in xpath) {
				if (Mix.empty(xpath[i])) continue;
				price	+= Context.countNumArr(Context.getXpathText(xpath));
			}
		}
		
		return price;
	},
	
	countNumArr: function (numArr) {
		var count	= 0;
		if (Mix.empty(numArr, true)) {
			Mix.log("numArr is empty, no need count");
			return count;
		}
		
		if (typeof numArr == "object") {
			var tmp	= 0;
			var item = '';
			for (var i in numArr) {
				item	= numArr[i];
				if (Mix.empty(item, true)) continue;
				tmp	= item.replace(/[^\d\.]/g, '');
				tmp	= parseFloat(tmp);
				if (!tmp || Number.isNaN(tmp)) continue;
				// If don't get dollar symbol, get it
				if (!Context.applyInfo.symbol) {
					Context.applyInfo.symbol	= Context.getDollarSymbol(item);
				}
				count	+= tmp;
			}
		}
		
		return count;
	},
	
	getDollarSymbol: function (str) {
		var symbolArr	= ['$','€','£','¥','₣','₩'];
		var symbol = '';
		if (!str) return symbol;
		for (var i in symbolArr) {
			if (str.indexOf(symbolArr[i]) != -1) {
				symbol	= symbolArr[i];
				break;
			}
		}
		return symbol;
	},
	
	// Fix JS  bug (like: 0.93 - 0.33)
	getReduce: function (num1, num2) {
		return (num1 * 1000 - num2 * 1000) / 1000;
	},
	
	sortCode: function (useInfo) {
		if (typeof useInfo != "object" || Mix.empty(useInfo)) {
			Mix.log("Sort code fail, param <useInfo> is empty or not an array");
			return useInfo;
		}
		useInfo.sort(function(a, b){
			return b.reduce - a.reduce;
		});
		return useInfo;
	}
	
};//End Context object


var Html = {
	getMain: function() {
		var count	= Context.reqData.count;
		var text	= 'Coupon Digger has found '+ count;
			text	+= count > 1 ? ' coupons' : ' coupon';
			text	+= ' on '+ Context.reqData.merName +'<br />';
			text	+= 'Want to try '+ (count > 1 ? 'them?' : 'it?');
		var html	= '<div id="cmus_main">';
			html	+= '  <div>'+ text +'</div>';
			html	+= '  <div class="cmus_main_button"><span id="cmus_autoApplyBtn">[Yes]</span><span id="cmus_closeMainBtn">[No]</span></div>';
			html	+= '</div>';
		return html;
	},
	
	getBtn: function() {
		var html	= '<div id="cmus_autoApplyBtn">';
			html	+= 'Click for saving money!';
			html	+= '</div>';
		return html;
	},
	
	getPopup: function() {
		var html	= '<div id="cmus_lightbox_cover"></div>';
		html		+= '<div id="cmus_lightbox_popup">';
		html		+= '  <div class="cmus_lightbox_container">';
		html		+= '    <div class="cmus_lightbox_close"><img src="http://myweb.com/test/plugin/images/close.png"></div>';
		html		+= '    <div class="cmus_lightbox_content"></div>';
		html		+= '  </div>';
		html		+= '</div>';
		return html;
	}
};//End Html object


var Animate = {
	showMain: function() {
		$("#cmus_lightbox_cover").show();
		$("#cmus_main").show();
	},
	hideMain: function() {
		$("#cmus_main").hide();
		$("#cmus_lightbox_cover").hide();
	},
	showPopup: function() {
		$("#cmus_lightbox_cover").show();
		$("#cmus_lightbox_popup").show();
	},
	hidePopup: function() {
		$("#cmus_lightbox_cover").hide();
		$("#cmus_lightbox_popup").hide();
		Context.clearApplyInfo();
	},
	
	showResult: function() {
		Animate.showPopup();
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var reduce		= Context.getReduce(origPrice, finalPrice);
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var content		= "Trying code(s) count: <b>" + appInfo.count + "</b><br /> Before use code: <b>" + symbol + origPrice + "</b>";
			content		+= "<br /> After use code: <b>"+ symbol + finalPrice + '</b>';
//		if (!reduce && appInfo.discount) {
//			reduce	= appInfo.discount;
//		} else if (reduce && !appInfo.discount) {
//			Context.applyInfo.discount	= reduce;
//		}
		if (reduce > 0) {
			if(!appInfo.discount) Context.applyInfo.discount	= reduce;
			content	= '<span style="font-size:14px;"><b>Congratulations</b>';
			content	+= '<br /><b>you saved "'+ symbol + reduce +'" dollars by code "'+ appInfo.applyCode +'"</b>';
			content	+= '<br /> Original price: ' + symbol + origPrice;
			content	+= '<span style="margin-left:15px">Latest price: ' + symbol + finalPrice + '</span>';
		} else {
			content = '<span style="font-size:16px;">Sorry, No coupon found</span>';
		}
		$(".cmus_lightbox_content").html(content);
	},
	
	showProcess: function() {
		Animate.showPopup();
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var curNum		= appInfo.codeIndex + 1;
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var count		= appInfo.count;
		if (curNum > count) curNum = count;
		var content		= "Trying codes " + curNum + " of " + count;
		if (origPrice) {
			content	+= "<br /> Original price: " + symbol + origPrice;
			if (!finalPrice) finalPrice	= origPrice;
			content	+= '<span style="margin-left:15px">Latest price: ' + symbol + finalPrice + '</span>';
		}
		$(".cmus_lightbox_content").html(content);
	},
	
	showApply: function() {
		Animate.showPopup();
		var content		= 'Finish. The best coupon is "' + Context.applyInfo.applyCode + '", automatically apply for you';
		$(".cmus_lightbox_content").html(content);
	}
};//End Animate object

	
//}//End content page


if (IS_INJECT_CONTENT_PAGE) {
	Mix.log("Aready injected page content......");
} else {
	Mix.log("Is injecting page content......");
	IS_INJECT_CONTENT_PAGE	= true;
	
	chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
		if (!Request || (!Request.reqType && !Request.pageType) || Request.ret != 0) {
			sendResponse({ret: -1});
			return ;
		}

		switch (Request.reqType) {
			// Embed plugin<html> to current page
			case PT_EMBED_COUPON:
				Context.reqData	= Request;
				sendResponse({ret: 0});
				break;
		}
	});
}

$(document).ready(function(){
	Context.init();
	$("#cmus_autoApplyBtn").live("click", Context.execute);
	$(".cmus_lightbox_close").live("click", Animate.hidePopup);
	$("#cmus_closeMainBtn").live("click", Animate.hideMain);
});

