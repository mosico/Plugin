/**
 * Make sure don't remove this block <comment>
 * CMUS-Coupon-Digger content page JS
 */

var loopHandle	= null;
var loopTimes	= 0;
var curApplyTime	= 0;
var Context	= {
	reqData: null,
	applyInfo: null,
	isInject: false,
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
			
			if (Context.checkRegular()) {
				var intvTime	= Context.reqData.pageRegular.intervalTime;
				var applyType	= Context.reqData.pageRegular.applyType;
				if (intvTime > 0) Context.intervalTime	= intvTime * 1000;
				if (applyType !== 'REFLASH') Context.applyType	= applyType;
				Context.injectDom().autoCheck();
			} else {
				Mix.log("Regular xpaths are not supply or don't match!!");
			}
		}
	},
	
	getRemoveDom: function() {
		var dom	= null;
		
//		if (Context.reqData.domain == 'lampsplus.com') {
//			Context.reqData.pageRegular.removeXpath	= '//input[@id="btnRemovePromoCode"]';
//		} else if (Context.reqData.domain == 'ashro.com') {
//			Context.reqData.pageRegular.removeXpath	= "//div[@id='colRight']/form/p/a";
//		}
		
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
		if (Mix.empty(Context.reqData.pageRegular)) {
			return result;
		}
		// Verify input&price&submit xpaths, add price>0
		var Regu	= Context.reqData.pageRegular;
		
		// If has cart page url regular, match current url
		if (!Mix.empty(Regu.cartReg)) {
			try {
				var isMatched	= false;
				for (var i in Regu.cartReg) {
					var reg	= new RegExp(Regu.cartReg[i], 'i');
					if (reg.test(Context.reqData.url)) {
						isMatched	= true;
						break;
					}
				}
				if (!isMatched) {
					return result;
				}
			} catch (e) {
				Mix.log("Match cart page url error", e);
				return result;
			}
		}
		
		// If doesn't get price or price<=0 return false
		if (Mix.empty(Regu.priceXpath, true) || (Context.getPrice(Regu.priceXpath) <= 0)) {
			return result;
		}
		
		// Fix some special merchant, EX.apply button and remove button in the same xpath(such as fansedge.com)
		var fixRet	= Context.fixSpecialMerchant();
		if (fixRet.isSpecial) {
			return fixRet.checkResult;
		}
		
		// Find code inputbox and apply button
		if (!Mix.empty(Regu.inputXpath, true) && !Mix.empty(Regu.submitXpath, true)) {
			if (Context.getXpathDom(Regu.inputXpath) && Context.getXpathDom(Regu.submitXpath)) {
				result	= true;
			}
		}
		
		// If verify above xpaths false check isn't has revome link/button
		if (!result) {
			var removeDom	= Context.getRemoveDom();
			if (removeDom) {
				Context.removeDom	= removeDom;
				result	= true;
			}
		}
		
		return result;
	},
	
	fixSpecialMerchant: function() {
		var ret	= {isSpecial:false, checkResult: false};
		// Apply button and remove in the same position
		if (Context.reqData.domain === 'fansedge.com') {
			var btnDom	= Context.getXpathDom(Context.reqData.pageRegular.submitXpath);
			var clsName	= $(btnDom).attr('class');
			if (clsName.indexOf('inputCouponButtonRemove') >= 0) {
				Context.removeDom	= btnDom;
				ret.checkResult	= true;
			} else if (clsName.indexOf('inputCouponButton') >= 0) {
				ret.checkResult	= true;
			}
			ret.isSpecial	= true;
		}
		// Both reflash and ajax apply coupon code
		else if (Context.reqData.domain === 'target.com' && Context.reqData.url.indexOf('https://www-secure.target.com/checkout_process') === 0) {
			// Change reflash to ajax type in checkout page
			Context.reqData.pageRegular.applyType	= VERIFY_TYPE_AJAX;
			Context.reqData.pageRegular.intervalTime	= 3;
		}
		return ret;
	},
	
	clearOnBreak: function() {
		var prevIndex	= Context.applyInfo.codeIndex;
		var checkingHandle	= window.setTimeout(function(){
			var status	= Context.applyInfo.status;
			var curIndex	= Context.applyInfo.codeIndex;
			if (status === "checking" && curIndex === prevIndex) {
				window.clearInterval(checkingHandle);
				Context.clearApplyInfo();
			} else if (status === "start" || status === "finish") {
				window.clearInterval(checkingHandle);
			} else {
				prevIndex	= curIndex;
			}
		}, 10000);
	},
	
	initApplyInfo: function() {
		var count	= Context.reqData.count > 0 ? Context.reqData.count : 0;
		Context.applyInfo	= {count: count, codeIndex: 0, domain: "", status: "start", isApply: false, applyCode: '',
				originalPrice: 0, finalPrice: 0, discount: 0, symbol: '', useInfo: [], startTime: 0, endTime: 0, prevCode: ''};
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
		var Data		= Context.reqData;
		var removeDom	= Context.removeDom;
		var Regular		= Data.pageRegular;
		var maxLoopTimes	= Data.count;
		var prevCodeIndex	= 0;
		loopTimes		= Context.applyInfo.codeIndex + 1;
		loopTry();
		Context.clearOnBreak();
		function loopTry() {
			Context.setEndTime();
			var curTime	= curApplyTime;
			var price	= Context.getPrice(Regular.priceXpath);
			Context.applyInfo.finalPrice	= price;
			Context.applyInfo.endTime		= curTime;
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
			
			if (loopTimes === 1) {
				Context.applyInfo.originalPrice	= price;
				Context.applyInfo.startTime		= curTime;
				Context.applyInfo.prevCode		= Context.getInputCode(Regular.inputXpath);
			} else if (loopTimes > maxLoopTimes) {
				var applyCode	= Context.getBestCode();
				if (!applyCode)	applyCode	= Context.applyInfo.applyCode;
				
				// Apply the max discount code
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
				} else if (typeof Context.applyInfo.useInfo[0] === "object") {
					Context.applyInfo.useInfo[0].isRemove	= true;
				}
				$(removeDom).trigger('click');
				Context.saveApplyInfo({codeIndex: prevCodeIndex, status: "checking", domain: Data.domain});
				Animate.showProcess();
				return ;
			} else {
				Context.applyInfo.useInfo.push({couponId: curCoupon.couponId, code: curCoupon.code, price: price, reduce: 0, 
												isRemove: false, startTime: curTime});
				Context.saveApplyInfo({codeIndex: loopTimes - 1, status: "checking", domain: Data.domain});
				Animate.showProcess();
				Context.applyCode(curCoupon.code, Regular.inputXpath, Regular.submitXpath, loopTry);
			}
		}
	},
	
	getInputCode: function(inputXpath) {
		var code	= '';
		if (Mix.empty(inputXpath)) return code;
		var node	= Context.getXpathDom(inputXpath);
		if (!Mix.empty(node)) {
			code	= $(node).val();
		}
		return code;
	},
	
	getBestCode: function() {
		var code	= '';
		var useInfo	= Context.applyInfo.useInfo;
		if (typeof useInfo !== "object" || Mix.empty(useInfo)) {
			Mix.log("Sort code fail, param <useInfo> is empty or not an array");
			return code;
		}
		try {
			useInfo.sort(function(a, b){
				var retVal	= 0;
				if (a.price === b.price) {
					retVal	= b.reduce - a.reduce;
				} else {
					retVal	= a.price - b.price;
				}
				return retVal;
			});
			// Use the best code between the less price code and before trying used code
			if (useInfo[0].reduce > 0 && useInfo[0].price <= Context.applyInfo.originalPrice) {
				code	= useInfo[0].code;
			} else if (Context.applyInfo.prevCode) {
				code	= Context.applyInfo.prevCode;
			}
		} catch (e) {
			Mix.log("Sort code by price error", e);
		}
		return code;
	},
	
	applyCode: function(code, inputXpath, submitXpath, loopFun) {
		$(Context.getXpathDom(inputXpath)).val(code);
		var submitDom	= Context.getXpathDom(submitXpath);
		$(submitDom).trigger('click');
		Context.execHrefJs($(submitDom).attr("href"));	// Fix doesn't execute href js
		
		loopTimes++;
		
		if (Context.applyType	=== VERIFY_TYPE_AJAX) {
			loopHandle	= setTimeout(loopFun, Context.intervalTime);
		}
	},
	
	// Fix onclick event (like dell cart apply)
	execHrefJs: function(href) {
		if (Mix.empty(href, true)) return ;
		
		href	= href.replace(/\s|\r|\n|\t/g, '');
		if (href.indexOf('http') !== -1 || href.indexOf('javascript:void') === 0 
			|| href.indexOf('javascript:;') === 0 || href.indexOf('javascript:(') === 0) {
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
			// If excute time greate than 100 seconds, clear storage apply info
			if (applyInfo && applyInfo.startTime > 0) {
				var curTime	= (new Date()).getTime();
				var subTime	= Context.getSubTime(curTime, applyInfo.startTime);
				if (subTime > 300) {
					Context.clearApplyInfo();
					return;
				}
			}
			
			if (!applyInfo.status || applyInfo.domain !== Context.reqData.domain) {
				// applyInfo.status != 'checking' &&
				if (applyInfo.status !== 'checking' && Context.applyInfo.status === 'start' && !Context.hasAppendDom) {
					Animate.showMain();
				}
				return ;
			}
			
			var curCodeIndex	= parseInt(applyInfo.codeIndex) + 1;
			applyInfo.codeIndex = curCodeIndex;
			Context.applyInfo	= applyInfo;
			
			if (applyInfo.status === 'checking') { 
				if (applyInfo.codeIndex < applyInfo.count) {
					Context.setEndTime(true);
					Animate.showProcess();
				}
				setTimeout(Context.execute, 1000);
			} else if (applyInfo.status === 'finish') {
				Animate.showResult();
			}
		});
	},
	
	injectDom: function() {
		if (Mix.empty(Context.reqData) || Context.reqData.count < 1) {
			Mix.log("Doesn't has coupon data, stop inject plugin dom !!", Context.reqData);
			return this;
		}
		
		$("body").append(Html.getMain());
		Context.isInject	= true;
//		var appendDom		= null;
//		var appendXpath		= Context.reqData.pageRegular.appendXpath;
//		if (!Mix.empty(appendXpath)) {
//			appendDom	= Context.getXpathDom(appendXpath);
//		}
//		
//		// If don't get appendXpath refer's dom, stop execute 
//		if (!appendDom) {
//			Context.hasAppendDom	= false;
//			$("body").append(Html.getMain());
//		} else {
//			Context.hasAppendDom	= true;
//			$(appendDom).append(Html.getBtn());
//		}
		
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
			Mix.log("Xpath is empty, stop get xpath refer dom !!", xpath);
			return node;
		}
		
		if (typeof xpath === "string"){
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
			if (typeof callback === "function") {
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
	
	gotoCM: function() {
		Context.sendRequest({reqType: 'openLink', tagUrl: 'http://www.couponmountain.com/'});
	},
	
	getPrice: function(xpath) {
		var price	= 0;
		if (Mix.empty(xpath)) {
			Mix.log("Price xpath is empty");
			return price;
		}
		
		if (typeof xpath === "string") {
			price	= Context.countNumArr(Context.getXpathText(xpath));
		} else {
			for (var i in xpath) {
				if (Mix.empty(xpath[i])) continue;
				price	+= Context.countNumArr(Context.getXpathText(xpath));
			}
		}
		
		return price;
	},
	
	countNumArr: function(numArr) {
		var count	= 0;
		if (Mix.empty(numArr, true)) {
			Mix.log("numArr is empty, no need count");
			return count;
		}
		
		if (typeof numArr === "object") {
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
	
	getDollarSymbol: function(str) {
		var symbolArr	= ['$','€','£','¥','₣','₩'];
		var symbol = '';
		if (!str) return symbol;
		for (var i in symbolArr) {
			if (str.indexOf(symbolArr[i]) !== -1) {
				symbol	= symbolArr[i];
				break;
			}
		}
		return symbol;
	},
	
	// Fix JS  bug (like: 0.93 - 0.33)
	getReduce: function(num1, num2) {
		var reduce	= num1 - num2;
		if (reduce.toString().length > 10) {
			reduce	= (num1 * 100 - num2 * 100) / 100;
			if (reduce.toString().length > 10) {
				reduce	= (Math.round(num1 * 100) - Math.round(num2 * 100)) / 100;
			}
		}
		return reduce;
	},
	
	getSubTime: function(time1, time2) {
		var sub	= time1 - time2;
		if (sub > 0) {
			sub	= sub / 1000;
		}
		return Math.round(sub);
	},
	
	setEndTime: function(isForce) {
		if (isForce || !curApplyTime || Context.reqData.pageRegular.applyType === VERIFY_TYPE_AJAX) {
			curApplyTime	= (new Date()).getTime();
			Context.applyInfo.endTime	= curApplyTime;
		}
	},
	
	getTimeLeft: function() {
		var leftSec	= 0;
		if (!Context.applyInfo || !Context.applyInfo.count) return leftSec;
		var data	= Context.applyInfo;
		if (data.codeIndex < 1) {
			leftSec	= data.count * 6;
		} else {
			var avgTime	= Context.getSubTime(data.endTime, data.startTime) / data.codeIndex;
			if (data.codeIndex >= data.count) {
				leftSec = avgTime;
			} else {
				leftSec	= avgTime * (data.count - data.codeIndex);
			}
		}
		leftSec	= Math.round(leftSec);
		return leftSec;
	}
	
};//End Context object


var Html = {
	buildPopup: function(innerHtml) {
		var html	= '\
			<div class="cmus_popup_wp">\
				<div class="cmus_popup">\
					<div class="cmus_popup_mask"></div>\
					<div class="cmus_popup_close"></div>\
					<div class="cmus_popup_content">\
						<div class="cmus_coupon">\
						';
			html	+= innerHtml;
			html	+= '\
						</div>\
						<div class="cmus_tips"><div>Fun Fact:</div> Consumers saved $3.7 billion using coupons in 2010.</div>\
					</div>\
				</div>\
			</div>\
						';
		return html;
	},
	
	getMain: function() {
		var count	= Context.reqData.count;
		var coupon	= count > 1 ? ' coupons' : ' coupon';
		var innerHtml	= '\
			<div class="cmus_cmlogo"></div>\
			<div class="cmus_choose">\
				<div class="cmus_message">\
					Coupon Digger has found <div class="cmus_coupontotal">'+count+'</div> '+coupon+' <br />on \
					<div class="cums_storename">'+Context.reqData.merName+'.</div>\
				</div>\
				<div class="cmus_findsavings">Find My Savings?</div>\
				<div class="cmus_choose_but">\
					<div class="cmus_but_yes" id="cmus_autoApplyBtn"><div>Yes</div></div>\
					<div class="cmus_but_no" id="cmus_closeMainBtn"><div>No</div></div>\
				</div>\
			</div>\
						';
		var html	= Html.buildPopup(innerHtml);	
		return html;
	},
	
	getProcess: function() {
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var curNum		= appInfo.codeIndex + 1;
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var count		= appInfo.count;
		var timeLeft	= Context.getTimeLeft();
		if (curNum < 1) {
			curNum	= 1;
		} else if (curNum > count) {
			curNum = count;
		}
		var percent		= Math.round((curNum - 1) / count * 100);
		var innerHtml	= '\
			<div class="cmus_cmlogo"></div>\
			<div class="cmus_tryingcodes">\
				<div class="cmus_message">Finding you the <div>BIGGEST</div> savings!</div>\
				<div class="cmus_process">\
					<div class="cmus_process_title">Trying codes <div>'+curNum+'</div> of <div class="cmus_coupontotal">'+count+'</div></div>\
					<div class="cmus_process_bar">\
						<div class="cmus_process_bar_content">\
							<div class="cmus_process_percent" style="width: '+percent+'%;"></div>\
						</div>\
					</div>\
					<div class="cmus_process_bottom">\
						<div class="cmus_process_stop">Stop Saving</div>\
						<div class="cmus_process_timeremain">Est. Time Remaining: <div>'+timeLeft+'s</div></div>\
					</div>\
				</div>\
				<div class="cmus_savemoney">Original Price: <div class="cmus_originalprice">'+symbol+origPrice+'</div>    \
					Latest Price: <div class="cmus_latestprice">'+symbol+finalPrice+'</div></div>\
			</div>\
							';
		return innerHtml;
	}, 
	
	getApply: function() {
		var innerHtml	= '\
			<div class="cmus_cmlogo"></div>\
			<div class="cmus_finish">\
				<div class="cmus_message">We found you savings!</div>\
				<div class="cmus_applyingcode">\
					We\'re automatically applying<br />\
					“ <div>'+Context.applyInfo.applyCode+'</div> ” for you.\
				</div>\
				<div class="cmus_process">\
					<div class="cmus_process_bar">\
						<div class="cmus_process_bar_content">\
							<div class="cmus_process_percent" style="width: 100%;"></div>\
						</div>\
					</div>\
				</div>\
			</div>\
						';
		return innerHtml;
	},
	
	getCongratulation: function(savePrice, origPrice, finalPrice) {
		var innerHtml	= '\
			<div class="cmus_cmlogo"></div>\
			<div class="cmus_congratulations">\
				<div class="cmus_congratulations_title">Congratulations</div>\
				<div class="cmus_message">\
					You just saved <div class="cmus_saved">'+savePrice+'</div> with Coupon Digger.\
				</div>\
				<div class="cmus_savemoney">Original Price: <div class="cmus_originalprice">'+origPrice+'</div>    \
					Latest Price: <div class="cmus_latestprice">'+finalPrice+'</div></div>\
				<div class="cmus_share_but">\
					<div class="cmus_but_facebook"></div>\
					<div class="cmus_but_twitter"></div>\
					<div class="cmus_but_email"></div>\
				</div>\
			</div>\
							';
		return innerHtml;
	},
	
	getSorry: function() {
		var innerHtml	= '\
			<div class="cmus_cmlogo"></div>\
			<div class="cmus_sorry">\
				<div class="cmus_message">\
					No coupons currently available for<br />\
					this order. Check out <div class="cmus_cmlink">Coupon Mountain</div><br />\
					to find other savings.\
				</div>\
			</div>\
							';
		return innerHtml;
	}
	
};//End Html object


var Animate = {
	showMain: function() {
		$(".cmus_popup_wp").show();
	},
	hideMain: function() {
		$(".cmus_popup_wp").hide();
		Context.clearApplyInfo();
	},
	
	showResult: function() {
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var reduce		= Context.getReduce(origPrice, finalPrice);
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var innerHtml	= '';
		if (reduce > 0) {
			if(!appInfo.discount) Context.applyInfo.discount	= reduce;
			innerHtml	= Html.getCongratulation(symbol+reduce, symbol+origPrice, symbol+finalPrice);
		} else {
			innerHtml	= Html.getSorry();
		}
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	},
	
	showProcess: function() {
		var innerHtml	= Html.getProcess();
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	},
	
	showApply: function() {
		var innerHtml	= Html.getApply();
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	}
};//End Animate object

	
//}//End content page


if (IS_INJECT_CONTENT_PAGE) {
	Mix.log("Aready injected page content......");
} else {
	Mix.log("Is injecting page content......");
	IS_INJECT_CONTENT_PAGE	= true;
	
	chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
		if (!Request || (!Request.reqType && !Request.pageType) || Request.ret !== 0) {
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
	$("#cmus_closeMainBtn, .cmus_popup_close, .cmus_process_stop").live("click", Animate.hideMain);
	$(".cmus_cmlink").live("click", Context.gotoCM);
});

