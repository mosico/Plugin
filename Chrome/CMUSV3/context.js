/**
 * Make sure don't remove this block <comment>
 * CMUS-Coupon-Digger content page JS
 */

var Context	= {
	reqData: null,
	applyInfo: null,
	
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
			switch (Context.reqData.domain) {
				case "target.com":
					Context.initTargetXpath();
					break;
				case "dell.com":
					Context.initDellXpath();
					break;
				default:
					return ;
					break;
			}
			Context.injectDom().autoCheck();
		}
	},
	
	initApplyInfo: function() {
		Context.applyInfo	= {codeIndex: 0, domain: "", status: "start", originalPrice: 0, finalPrice: 0, symbol: '', useInfo: []};
	},
	
	initTargetXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="promoCode"]'];
		Context.reqData.pageRegular.submitXpath	= ['//button[@class="button tier-2 applyButton"]'];
		Context.reqData.pageRegular.appendXpath	= ['//div[@class="input-field"]'];
		Context.reqData.pageRegular.priceXpath	= ['//li[@id="final-price"]/span[@class="subtotalLabel-price"]'];
		Context.reqData.execInterval	= 2000;
		Context.reqData.verifyType		= VERIFY_TYPE_REFLASH;
	},
	
	initDellXpath: function() {
		Context.reqData.pageRegular.inputXpath	= ['//input[@id="basketCoupons_manual_coupon_code"]'];
		Context.reqData.pageRegular.submitXpath	= ['//a[@testid="basketCoupons_InternalLink2"]'];
//		Context.reqData.pageRegular.appendXpath	= ['//input[@id="basketCoupons_manual_coupon_code"]/../'];
		Context.reqData.pageRegular.appendXpath	= ['//table[@id="Table10"]//table/tbody/tr[2]/td[2]'];
		Context.reqData.pageRegular.priceXpath	= ['//span[@id="basketItems__CartItemsRepeater__item_0_0"]//td/span[@class="price_text_bold"]'];
		Context.reqData.execInterval	= 2000;
		Context.reqData.verifyType		= VERIFY_TYPE_REFLASH;
	},
	
	execute: function() {
		console.log("Code index: "+Context.applyInfo.codeIndex);
		
		var Data	= Context.reqData;
//		if (Mix.empty(Data.coupon) || Data.pageType != PT_CART_PAGE) {
//			Mix.log("Don't has coupon or current page is not cart page !!");
//			return ;
//		}
		
		var Regular		= Data.pageRegular;
		var loopTimes	= Context.applyInfo.codeIndex + 1;
		var maxLoopTimes = Data.count;
		var loopHandle	= null;
		loopTry();
		function loopTry() {
			var price		= Context.getPrice(Regular.priceXpath);
			if (loopTimes - 2 >= 0 && loopTimes - 2 < maxLoopTimes) {
				Context.applyInfo.useInfo[loopTimes - 2].price	= price;
				Context.applyInfo.finalPrice	= price;
			}
			
			if (loopTimes == 1) {
				Context.applyInfo.originalPrice	= price;
			} else if (loopTimes >= maxLoopTimes) {
				clearTimeout(loopHandle);
				// get final total price, add do some log or output snme message
				Context.saveApplyInfo({finalPrice: price, status: "finish"});
				Animate.showResult();
				return ;
			}
			
			
			var curCoupon	= Data.coupon[loopTimes - 1];
			
			// Saving apply/submit code info
			Context.applyInfo.useInfo.push({couponId: curCoupon.couponId, code: curCoupon.code, price: price});
			Context.saveApplyInfo({codeIndex: loopTimes - 1, status: "checking", domain: Data.domain});
			
			$(Context.getXpathDom(Regular.inputXpath)).val(curCoupon.code);
			console.log("Starting apply "+ loopTimes +" code...", curCoupon.code);
			var submitDom	= Context.getXpathDom(Regular.submitXpath);
			$(submitDom).trigger('click');
			Animate.showProcess();
			Context.execHrefJs($(submitDom).attr("href"));	// Fix doesn't execute href js
			
			loopTimes++;
			
			if (Data.verifyType	== VERIFY_TYPE_AJAX) {
				loopHandle	= setTimeout(loopTry, Data.execInterval);
			}
		}
	},
	
	// Fix onclick event (like dell cart apply)
	execHrefJs: function(href) {
		href	= href.replace(/\s|\r|\n|\t/g, '');
		if (!href || href.indexOf('http') != -1 || href.indexOf('javascript:void') == 0 
			|| href.indexOf('javascript:;') == 0 || href.indexOf('javascript:(') == 0) {
			return ;
		}
		href	= href.replace("javascript:", '');
		setTimeout(function(){
			console.log(href, typeof href);
//			var sp	= href.split('(');
//			var fn	= '<script>';
//			for (var i in sp) {
//				if (i > 0) fn += '(';
//				fn += sp[i];
//			}
//			fn += '</script>';
			var execScript = document.createElement("script");
			execScript.type = "text/javascript";
			execScript.text = href;
			document.body.appendChild(execScript);
		}, 500);
	},
	
	// If is running apply/check coupon code, auto click apply button
	autoCheck: function() {
		Context.getApplyInfo(function(applyInfo){
			console.log("applyInfo:", applyInfo);
			if (!applyInfo.status || applyInfo.domain != Context.reqData.domain) {
				return ;
			}
			
			var curCodeIndex	= parseInt(applyInfo.codeIndex) + 1;
			applyInfo.codeIndex = curCodeIndex;
			Context.applyInfo	= applyInfo;
			
			if (applyInfo.status == 'checking') {
				console.log("Continue checking...");
				Animate.showProcess();
				setTimeout(function(){
					$("#cmus_autoApplyBtn").trigger('click');
				}, 1000);
			}
		});
	},
	
	injectDom: function() {
		if (Mix.empty(Context.reqData) || Context.reqData.count < 1) {
			Mix.log("Doesn't has coupon data, stop inject plugin dom !!", Context.reqData);
			return this;
		}
		
		var btnHtml		= Html.getBtn();
		var popupHtml	= Html.getPopup();
		var appendDom	= Context.getXpathDom(Context.reqData.pageRegular.appendXpath);
		
		// If don't get appendXpath refer's dom, stop execute 
		if (!appendDom) {
			Mix.log("Doesn't get appendXpath's dom !!");
			return this;
		}
		
		$(appendDom).append(btnHtml);
		$("body").append(popupHtml);
		
		return this;
	},
	
	getXpathText: function(xpath) {
		var textArr		= [];
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
			node	= document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
		} else {
			// appendXpath is an array
			for (var i in xpath) {
				if (Mix.empty(xpath[i])) continue;
				node	= document.evaluate(xpath[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
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
		return Math.abs((num1 * 1000 - num2 * 1000) / 1000);
	}
	
};//End Context object


var Html = {
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
		var symbol		= appInfo.symbol;
		var content		= "Trying code(s) count: <b>" + Context.reqData.count + "</b><br /> Before use code: <b>" + symbol + origPrice + "</b><br /> After use code: <b>"+ symbol + finalPrice + '</b>';
		if (reduce > 0) {
			content	+= "<br />Congratulation: you saved: <b>"+ symbol + reduce + '</b>';
		} else {
			content += '<br />We are sorry for no code be used.';
		}
		$(".cmus_lightbox_content").html(content);
	},
	
	showProcess: function() {
		Animate.showPopup();
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var curNum		= appInfo.codeIndex + 1;
		var symbol		= appInfo.symbol;
		var content		= "Trying code(s) process: <b>" + curNum + " / " + Context.reqData.count + "</b>";
		if (origPrice) {
			content	+= "<br /> Original price: <b>" + symbol + origPrice + "</b>";
			if (!finalPrice) finalPrice	= origPrice;
			content	+= "<br /> Current price: <b>" + symbol + finalPrice + "</b>";
		}
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
});

