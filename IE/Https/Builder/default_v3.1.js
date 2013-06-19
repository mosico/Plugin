/**
 * Make sure don't remove this block <comment>
 * CMUS-Coupon-Digger content page JS
 */
if (window.top == window){
var IS_INJECT_CONTENT_PAGE = IS_INJECT_CONTENT_PAGE || false;
if (IS_INJECT_CONTENT_PAGE) {
	Mix.log("Aready injected page content......");
} else {
IS_INJECT_CONTENT_PAGE	= true;
Mix.log("Is injecting page content......");
var loopTimes		= 0;
var curApplyTime	= 0;
var isForceClosed	= false;
var isPauseApply	= false;
var explorerType	= '';
var Context	= {
	reqData: null,
	applyInfo: null,
	isInject: false,
	hasAppendDom: false,
	intervalTime: 4000,
	applyType: 'REFLASH',
	removeDom: null,
	isForceRemove: false,
	isExecHref: true,
	
	init: function() {
		var loopWaitHandle	= null;
		var loopCheckHandel	= null;
		doStarting();
		
		function doStarting() {
			if (Mix.empty(Context.reqData)) {
				loopWaitHandle	= setTimeout(doStarting, 200);
				return ;
			}
			clearTimeout(loopWaitHandle);
			
			// If Don't has pageRegular attribute, set it
			if (!Context.reqData.pageRegular) Context.reqData.pageRegular = {};
			Context.isForceRemove	= Context.reqData.pageRegular.needRemove == 1 ? true : false;
			Context.isExecHref	= Context.reqData.pageRegular.noExecHref == 1 ? false : true;
			
			//if (Context.reqData.pauseStatus == 1) isPauseApply	= true;
			Context.initPauseStatus();
			
			Context.initApplyInfo();
			
			// Ajax load data, loop check xpath data
			if (Context.reqData.pageRegular.isAjax) {
				var cartReg		= Context.reqData.pageRegular.cartReg;
				var isCartPage	= false;
				if (Mix.empty(cartReg)) {
					isCartPage	= true;
				} else {
					for (var i = 0; i < cartReg.length; i++) {
						var reg	= new RegExp(Context.reqData.pageRegular.cartReg[i]);
						if (reg.test(Context.reqData.url)) {
							isCartPage	= true;
							break;
						}
					}
				}
				if (!isCartPage) {
					Mix.log("Current merchant's data is ajax load, but url doesn't match cart regular ...");
					return ;
				}
				loopCheckHandel	= setInterval(function(){
					if (Context.checkRegular()) {
						clearInterval(loopCheckHandel);
						doExec();
					}
				}, 800);
				Mix.log("Loop check Ajax data....");
				return ;
			}
			
			// Normal load data
			if (Context.checkRegular()) {
				doExec();
			} else {
				Mix.log("Regular xpaths are not supply or don't match!!");
			}
		};
		
		function doExec() {
			var intvTime	= Context.reqData.pageRegular.intervalTime;
			var applyType	= Context.reqData.pageRegular.applyType;
			if (intvTime > 0) Context.intervalTime	= intvTime * 1000;
			if (applyType !== 'REFLASH') Context.applyType	= applyType;
			Context.injectDom().autoCheck();
		};
	},
	
	getExplorer: function() {
		var exp	= '';
		var ua	= window.navigator.userAgent;
		if (ua.indexOf('Chrome/') > 0) {
			exp	= 'chrome';
		} else if (ua.indexOf('Firefox/') > 0) {
			exp	= 'firefox';
		} else if (ua.indexOf('MSIE') > 0 || ua.indexOf('.NET') > 0) {
			exp	= 'ie';
		} else if (ua.indexOf('Safari') > 0 && ua.indexOf('Chrome') == -1) {
			exp= 'safari';
		} else {
			exp	= 'unknow';
		}
		return exp;
	},
	
	getRemoveDom: function() {
		var dom	= null;
		
		var removeXpath	= Context.reqData.pageRegular.removeXpath;
		if (!Mix.empty(removeXpath)) {
			switch (typeof removeXpath) {
				case 'string':
					dom	= Context.getXpathDom(removeXpath);
					break;
				case 'object':
					for (var i = 0; i < removeXpath.length; i++) {
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
			Mix.log('pageRegular(Xpath) is empty...');
			return result;
		}
		if (Context.getNoPopup()) {
			Context.clearNoPopup();
			Mix.log("Has no popup flag, don't show it this time");
			return result;
		}
		
		// Verify input&price&submit xpaths, add price>0
		var Regu	= Context.reqData.pageRegular;
		
		// If has cart page url regular, match current url
		if (!Mix.empty(Regu.cartReg)) {
			try {
				var isMatched	= false;
				for (var i = 0; i < Regu.cartReg.length; i++) {
					var reg	= new RegExp(Regu.cartReg[i], 'i');
					if (reg.test(Context.reqData.url)) {
						isMatched	= true;
						break;
					}
				}
				if (!isMatched) {
					Mix.log("Cat page regular/rule isn't correct...");
					return result;
				}
			} catch (e) {
				Mix.log("Match cart page url error", e);
				return result;
			}
		}
		
		// If doesn't get price or price<=0 return false
		if (Mix.empty(Regu.priceXpath, true) || (Context.getPrice(Regu.priceXpath) <= 0)) {
			Mix.log("price xpath isn't crrect or price<=0...", Regu.priceXpath);
			return result;
		}
		
		// Fix some special merchant, EX.apply button and remove button in the same xpath(such as fansedge.com)
		var fixRet	= Context.fixSpecialMerchant();
		if (fixRet.isSpecial) {
			Mix.log("this is a special fix merchant", fixRet);
			return fixRet.checkResult;
		}
		
		// Find code inputbox and apply button
		if (!Mix.empty(Regu.inputXpath, true) && !Mix.empty(Regu.submitXpath, true)) {
			if (Context.getXpathDom(Regu.inputXpath) && Context.getXpathDom(Regu.submitXpath)) {
				result	= true;
			} else {
				Mix.log("inputXpath or submitXpath incorrect...", Regu);
			}
		} else {
			Mix.log("inputXpath or submitXpath is empty...", Regu);
		}
		
		// If verify above xpaths false check isn't has revome link/button
		if (!result || Context.isForceRemove) {
			var removeDom	= Context.getRemoveDom();
			if (removeDom) {
				Context.removeDom	= removeDom;
				result	= true;
				Mix.log("this page has remove dom...");
			}
		}
		
		return result;
	},
	
	fixSpecialMerchant: function() {
		var ret	= {isSpecial:false, checkResult: false};
		var curDomain	= Context.reqData.domain.toLowerCase();
		// Apply button and remove in the same position
		if (curDomain === 'fansedge.com') {
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
		else if (curDomain === 'target.com' && Context.reqData.url.indexOf('https://www-secure.target.com/checkout_process') === 0) {
			// Change reflash to ajax type in checkout page
			Context.reqData.pageRegular.applyType	= VERIFY_TYPE_AJAX;
			Context.reqData.pageRegular.intervalTime	= 3;
			Context.reqData.pageRegular.removeXpath	= [];
		}
		return ret;
	},
	
	clearOnBreak: function() {
		var prevIndex	= Context.applyInfo.codeIndex;
		var intvTime	= APPLY_BREAK_TIME + Context.reqData.codeTime * 1000;
		var checkingHandle	= null;
		checkingHandle	= window.setInterval(function(){
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
		}, intvTime);
	},
	
	initApplyInfo: function() {
		var count		= Context.reqData.count > 0 ? Context.reqData.count : 0;
		var trackUrl	= Context.reqData.trackUrl ? Context.reqData.trackUrl : "";
		var merId		= Context.reqData.merId ? Context.reqData.merId : 0;
		Context.applyInfo	= {count: count, codeIndex: 0, domain: "", merId: merId, status: "start", isApply: false, applyCode: '', trackUrl: trackUrl,
				originalPrice: 0, finalPrice: 0, discount: 0, symbol: '', useInfo: [], startTime: 0, endTime: 0, prevCode: ''};
	},
	
	execute: function() {
		if (isForceClosed) return ;
		if (!Context.isTryingOK()) return ;		// Fix Hp first time trying bug
		var Data		= Context.reqData;
		var removeDom	= Context.removeDom;
		var Regular		= Data.pageRegular;
		var maxLoopTimes	= Data.count;
		var prevCodeIndex	= 0;
		loopTimes		= Context.applyInfo.codeIndex + 1;
		loopTry();
//		Context.clearOnBreak();
		
		function loopTry() {
			if (isForceClosed) return ;
			if (!Context.isTryingOK()) return ;
			// Ajax type check every time
			if (Context.applyType === VERIFY_TYPE_AJAX) {
				Context.removeDom	= null;
				Context.checkRegular();
				removeDom	= Context.removeDom;
			}
			var curIndex	= loopTimes > maxLoopTimes ? maxLoopTimes - 1 : loopTimes - 1;
			var curCoupon	= Data.coupon[curIndex];
			Context.setEndTime();
			var curTime	= curApplyTime;
			var price	= Context.getPrice(Regular.priceXpath);
			Context.applyInfo.finalPrice	= price;
			Context.applyInfo.endTime		= curTime;
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
				if (!removeDom) {
					Context.trackMerUrl();
				}
			} else if (loopTimes > maxLoopTimes) {
				var applyCode	= Context.getBestCode();
				if (!applyCode)	applyCode	= Context.applyInfo.applyCode;
				
				function _applyBestCode() {
					if (isPauseApply) return ;
					// Remove code
					if (removeDom) {
						Context.applyInfo.useInfo[prevCodeIndex].isRemove	= true;
						Context.saveApplyInfo({codeIndex: prevCodeIndex, applyCode: applyCode});
						//$(removeDom).trigger('click');
						//removeDom.click();
						Context.fireEvent(removeDom,'click');
						Animate.showApply();
						Context.execHrefJs($(removeDom).attr("href"));	// Fix doesn't execute href js
						if (Context.applyType === VERIFY_TYPE_AJAX) setTimeout(loopTry, Context.intervalTime);	// Fix ajax stop
					} else {
						Context.saveApplyInfo({isApply: true, applyCode: applyCode});
						Animate.showApply();
						Context.applyCode(applyCode, Regular.inputXpath, Regular.submitXpath, loopTry);
					}
				};
				// Apply the max discount code
				if (maxLoopTimes > 1 && applyCode && prevCodeIndex < maxLoopTimes) {
					if (Context.reqData.codeTime > 0) {
						// Options setting interval time
						setTimeout(_applyBestCode, Context.reqData.codeTime * 1000);
						Context.applyInfo.applyCode	= applyCode;
						Animate.showApply();
					} else {
						_applyBestCode();
					}
					return ;
				}
				

				// get final total price, add do some log or output some message
				var discount	= Context.getPrice(Regular.discountXpath);
				Context.saveApplyInfo({finalPrice: price, status: "finish", discount: discount});
				Animate.showResult();
				Context.logUseInfo();
				return ;
			}
			
			if (Context.reqData.codeTime > 0) {
				// Options setting interval time
				setTimeout(_applyEachCode, Context.reqData.codeTime * 1000);
				if (loopTimes == 1) Animate.showProcess();
			} else {
				_applyEachCode();
			}
			
			function _applyEachCode() {
				if (isPauseApply) return ;
				// Remove code
				if (removeDom) {
					if (prevCodeIndex >= 0) {
						Context.applyInfo.useInfo[prevCodeIndex].isRemove	= true;
					} else if (typeof Context.applyInfo.useInfo[0] === "object") {
						Context.applyInfo.useInfo[0].isRemove	= true;
					}
					//$(removeDom).trigger('click');
					//removeDom.click();
					Context.fireEvent(removeDom,'click');
					Context.saveApplyInfo({codeIndex: prevCodeIndex, status: "checking", domain: Data.domain});
					Animate.showProcess(true);
					Context.execHrefJs($(removeDom).attr("href"));	// Fix doesn't execute href js
					if (Context.applyType === VERIFY_TYPE_AJAX) setTimeout(loopTry, Context.intervalTime);	// Fix ajax stop
				} else {
					Context.applyInfo.useInfo.push({couponId: curCoupon.couponId, code: curCoupon.code, price: price, reduce: 0, 
													isRemove: false, startTime: curTime});
					Context.saveApplyInfo({codeIndex: loopTimes - 1, status: "checking", domain: Data.domain});
					Animate.showProcess();
					Context.applyCode(curCoupon.code, Regular.inputXpath, Regular.submitXpath, loopTry);
				}
			};
		}
	},
	
	// Fix hp first time trying bug
	isTryingOK: function() {
		var ret	= false;
		// HP first time trying code loop excute the second like first
		if (((new Date()).getTime() - Context.applyInfo.endTime) > 900) {
			ret	= true;
		}
		return ret;
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
		var code		= '';
		var applyInfo	= Context.applyInfo;
		var useInfo		= applyInfo.useInfo;
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
			var origPrice	= parseFloat(applyInfo.originalPrice);
			var finalPrice	= parseFloat(applyInfo.finalPrice);
			var bestPrice	= parseFloat(useInfo[0].price);
			// Use the best code between the less price code and before trying used code
			if ((bestPrice < origPrice) || 
				(finalPrice > origPrice && bestPrice == origPrice)) {
				code	= useInfo[0].code;
			} else if (applyInfo.prevCode && finalPrice > origPrice) {
				code	= applyInfo.prevCode;
			}
		} catch (e) {
			Mix.log("Sort code by price error", e);
		}
		return code;
	},
	
	applyCode: function(code, inputXpath, submitXpath, loopFun) {
		var curDomain	= Context.reqData.domain.toLowerCase();
		var submitDom	= Context.getXpathDom(submitXpath);
		var inputCode   = Context.getXpathDom(inputXpath);
		// Fix BuyDig.com many input
		if (curDomain === 'buydig.com') {
			$("#hCoupon").val(code);
			$("#hCouponUpd").val(code);
		// Fix drjays.com can't trigger onchange event
		} else if (curDomain === 'drjays.com') {
			Context.execInPage(code, inputXpath, submitXpath);
		}
		try {
			$(inputCode).mousedown().focus().val(code).mouseup().change().blur();
			Context.fireEvent(inputCode,'keyup');
			//$(submitDom).focus().trigger('click');
			Context.fireEvent(submitDom,'focus');
			Context.fireEvent(submitDom,'click');
			//submitDom.focus();
			//submitDom.click();
		} catch (e) {
			Mix.log('Apply code error: ', e);
			//$(Context.getXpathDom(inputXpath)).val(code);
			//$(submitDom).trigger('click');
			Context.getXpathDom(inputXpath).value = code;
			//submitDom.click();
			Context.fireEvent(submitDom,'click');
		}
		if (curDomain !== 'hp.com' || explorerType === 'ie') {
			Context.execHrefJs($(submitDom).attr("href"));	// Fix doesn't execute href js
			$("body").mousedown().mouseup();
		}
		
		// Fix underarmour.com doesn't trigger click
		if ((explorerType !== 'ie') && (curDomain === 'underarmour.com' || curDomain === 'adorama.com' || curDomain === 'adidas.com')) {
			Context.execInPage(code, inputXpath, submitXpath);
		}
		
		loopTimes++;
		
		if (Context.applyType === VERIFY_TYPE_AJAX) {
//			var intvTime	= Context.reqData.codeTime > 0 ? Context.reqData.codeTime * 1000 : Context.intervalTime;
			var intvTime	= Context.intervalTime;
			setTimeout(loopFun, intvTime);
		}
	},
	
	execInPage: function(code, inputXpath, submitXpath) {
		var scriptObj	= document.createElement("script");
		scriptObj.type	= "text/javascript";
		scriptObj.text	= '\
		var inputNode	= null;\n\
		var submitNode	= null;\n\
		var inputXpath	= '+JSON.stringify(inputXpath)+';\n\
		var submitXpath	= '+JSON.stringify(submitXpath)+';\n\
		for (var i = 0; i < inputXpath.length; i++) {\n\
			var inputNode	= document.evaluate(inputXpath[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();\n\
			if (inputNode) break;\n\
		}\n\
		inputNode.value	= "'+code+'";\n\
		try {\n\
			if ("fireEvent" in inputNode)\n\
				inputNode.fireEvent("onchange");\n\
			else\n\
			{\n\
			    var evt = document.createEvent("HTMLEvents");\n\
			    evt.initEvent("change", false, true);\n\
			    inputNode.dispatchEvent(evt);\n\
			}\n\
		} catch (e) {\n\
			console.log("Trigger input onchange event failed...", e);\n\
		}\n\
		for (var i = 0; i < submitXpath; i++) {\n\
			var submitNode	= document.evaluate(submitXpath[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();\n\
			if (submitNode) break;\n\
		}\n\
		submitNode.click();\n\
		';
		document.body.appendChild(scriptObj);		
	},
	fireEvent: function(element,event) {
		if(!element)
			return;
		if (document.createEvent) {
			var eventTypes = ["HTMLEvents", "MouseEvents", "UIEvents", "MutationEvents", "Events"]
				,eventMap = {
					HTMLEvents : {
						abort : true,
						blur : true,
						change : true,
						error : true,
						focus : true,
						load : true,
						reset : true,
						resize : true,
						scroll : true,
						select : true,
						submit : true,
						unload : true
					},
					UIEvents : { // 包含MouseEvents
						DOMActivate : true,
						DOMFocusIn : true,
						DOMFocusOut : true,
						keydown : true,
						keypress : true,
						keyup : true
					},
					MouseEvents : {
						click : true,
						mousedown : true,
						mousemove : true,
						mouseout : true,
						mouseover : true,
						mouseup : true
					},
					MutationEvents : {
						DOMAttrModified : true,
						DOMNodeInserted : true,
						DOMNodeRemoved : true,
						DOMCharacterDataModified : true,
						DOMNodeInsertedIntoDocument : true,
						DOMNodeRemovedFromDocument : true,
						DOMSubtreeModified : true
					},
					Events : {
						// 所有事件
					}
				}
			,ename = 'Events'
			;
			for(var i=0,l=eventTypes.length;i<l;i++){
				if(eventMap[eventTypes[i]][event] === true){
					ename = eventTypes[i];
					break;
				}
			}
			var evt = document.createEvent(ename);
			evt.initEvent(event, true, true ); // event type,bubbling,cancelable
			return !element.dispatchEvent(evt);

		} else {
			// dispatch for IE
//			var evt = document.createEventObject();
//			return element.fireEvent('on'+event,evt);
			//IE use jquery trigger, because some site doesn't fire, like: 123inkjets.com
			var curDomain	= Context.reqData.domain.toLowerCase();
			if (curDomain == "target.com" || curDomain == "nationalgeographic.com" || curDomain === 'loccitane.com'
				|| curDomain == "adorama.com" || curDomain == "williams-sonoma.com") {
				element.click();
			} else {
				try {
					$(element).trigger(event);
				} catch (e) {
					element.click();
				}
			}
		}
	},

	// Fix onclick event (like dell cart apply)
	execHrefJs: function(href) {
		if (!Context.isExecHref) return;
		if (Mix.empty(href, true) || href.indexOf("#") === 0) return ;
		
		var hrefBK	= href.replace(/\s|\r|\n|\t/g, ' ');
		href	= hrefBK.replace(/\s/g, '').toLowerCase();
		if (href.indexOf('javascript:void') === 0 
			|| href.indexOf('javascript:;') === 0
			|| href.indexOf('javascript:(') === 0
			|| href.indexOf('javascript:/') === 0) {
			return ;
		}
		href	= hrefBK.replace("javascript:", '');
		// if href is a url, reflash this page, else execute it as javascript
		if (href.indexOf('(') === -1) {
			// url
			if (href.indexOf('http') === -1) {
				var origin	= "";
				if (window.location.origin) {
					origin	= window.location.origin;
				} else {
					origin	= window.location.protocol + "//" + window.location.host;
					var port	= window.location.port;
					if (port && port != 80) origin	+= ":" + port;
				}
				href	= origin + href;
			}
			window.location.href	= href;
		} else {
			// js
			setTimeout(function(){
				var execScript = document.createElement("script");
				execScript.type = "text/javascript";
				execScript.text = href;
				document.body.appendChild(execScript);
			}, 500);
		}
	},
	
	trackMerUrl: function() {
		var trackUrl	= Context.applyInfo.trackUrl;
		if (!trackUrl || trackUrl.length < 5 || explorerType === "ie" || explorerType === "safari") return ;
		Context.sendRequest({reqType:"callIframe", callUrl: trackUrl});
	},
	
	// If is running apply/check coupon code, auto click apply button
	autoCheck: function() {
		if (!Context.isInject) return ;
		
		Context.getApplyInfo(function(applyInfo){
			// If excute time greate than 100 seconds, clear storage apply info
			/*if (applyInfo && applyInfo.startTime > 0) {
				var curTime	= (new Date()).getTime();
				var maxTime	= Context.reqData.maxExecTime > APPLY_MIN_TIME ? Context.reqData.maxExecTime : APPLY_MAX_TIME;
				var subTime	= Context.getSubTime(curTime, applyInfo.startTime);
				if (subTime > maxTime) {
					Context.clearApplyInfo();
					Animate.showMain();
					Mix.log("Applying timeout, clear apply info, restart apply...");
					return;
				}
			}*/
			
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
//				Animate.showResult();
				Context.clearApplyInfo();
				Animate.showMain();
				Mix.log("Don't show result page again when reflash page ...");
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
			if (explorerType === "ie") {
				$(xpath).each(function(i, e){
					var text	= $(e).text();
					textArr.push(text);
				});
			} else {
				var iterator	= document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var node = iterator.iterateNext();
				if (node) {
					while (node) {
						var text	= node.textContent;
						text		= text.replace(/\r|\n|\t/g, '');
						text		= jQuery.trim(text);
						textArr.push(text);
						node = iterator.iterateNext();
					}
				} else {
					Mix.log("Not get xpath refer value, xpath: " + xpath);
				}
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
				if (explorerType === "ie") {
					node	= $(xpath)[0];
				} else {
					node	= document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
				}
			} catch (e) {
				Mix.log("Get dom fail, evaluate error :", xpath, e);
			}
		} else {
			if (explorerType === "ie") {
				// appendXpath is an array
				for (var i = 0; i < xpath.length; i++) {
					if (Mix.empty(xpath[i])) continue;
					try {
						node	= $(xpath[i])[0];
					} catch (e) {
						Mix.log("getXpathDom failure <array xpath> !!");
					}
					if (node) break;
				}
			} else {
				// appendXpath is an array
				for (var i = 0; i < xpath.length; i++) {
					if (Mix.empty(xpath[i])) continue;
					try {
						node	= document.evaluate(xpath[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null).iterateNext();
					} catch (e) {
						Mix.log("Get dom fail, evaluate error :", xpath, e);
					}
					if (node) break;
				}
			}
		}
		
		if (!node) {
			node	= null;
			Mix.log("Not get xpath refer dom/node, xpath: ", xpath);
		}
		
		return node;
	},
	
	sendRequest: function(Data, callback) {
		if (explorerType === 'chrome') {
			Data.tabUrl	= Context.reqData.url;
			Data.tabId	= Context.reqData.tabId;
			chrome.extension.sendRequest(Data, function(Res){
				if (typeof callback === "function") {
					callback(Res);
				}
			});
		} else if (explorerType === 'firefox') {
			self.port.emit('onMessage',Data);
			if (typeof callback === "function")
				self.port.once('onMessage',callback);
		}else if(explorerType ==='safari'){
			safari.self.tab.dispatchMessage(Data.reqType, Data);
				if (typeof callback === "function")
					this[Data.reqType+'Handler'] = callback;
		} else {
			Mix.log("Current explorer isn't chorme/firefox/safari !!......  sendRequest failure ");
		}
	},
	
	saveApplyInfo: function(modifyInfo) {
		var info	= jQuery.extend(Context.applyInfo, modifyInfo);
		Context.applyInfo	= info;
		// Save info with plugin localstage
		//Context.sendRequest({reqType: 'storeApplyInfo', info: info});
		// Save info with web localstage
		Context.setStorage("cmusApplyInfo", info);
	},
	getApplyInfo: function(callback) {
		//Context.sendRequest({reqType: 'getApplyInfo'}, callback);
		var info	= Context.getStorage("cmusApplyInfo");
		if (Mix.empty(info)) {
			info	= {};
		} else {
			try{
				info	= JSON.parse(info);
				// Fix IE some site, JSON parse bug, such as 'www.footsmart.com'
				if (info && (typeof info.useInfo == "string")) {
					info.useInfo	= JSON.parse(info.useInfo);
				}
			} catch(e) {
				Mix.log("Parse apply info error:", info);
				info	= {};
			}
		}
		callback(info);
	},
	clearApplyInfo: function() {
		//Context.sendRequest({reqType: 'storeApplyInfo', info: {}});
		//window.sessionStorage.setItem("cmusApplyInfo", "{}");
		Context.setStorage("cmusApplyInfo", "{}");
		Context.initApplyInfo();
		Context.pauseStatusOff();
	},
	
	logUseInfo: function() {
		if (explorerType === "ie") {
			CMUS_Message.sendUseInfo(Context.applyInfo);
		} else {
			var infoStr	= JSON.stringify(Context.applyInfo);
			Context.sendRequest({reqType:'logUseInfo', info:infoStr});
		}
	},
	
	gotoCM: function() {
		if (explorerType === "ie") {
			window.open('http://www.couponmountain.com/', '_blank');
		} else {
			Context.sendRequest({reqType: 'openLink', tagUrl: 'http://www.couponmountain.com/'});
		}
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
			for (var i = 0; i < xpath.length; i++) {
				if (Mix.empty(xpath[i])) continue;
				price	+= Context.countNumArr(Context.getXpathText(xpath[i]));
				if (price > 0) break;
			}
		}
		
		return parseFloat(price).toFixed(2);
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
			for (var i = 0; i < numArr.length; i++) {
				item	= numArr[i];
				if (Mix.empty(item, true)) continue;
				tmp	= item.replace(/[^\d\.]/g, '');
				tmp	= parseFloat(tmp);
				if (!tmp || isNaN(tmp)) continue;
				// If don't get dollar symbol, get it
				if (!Context.applyInfo.symbol) {
					Context.applyInfo.symbol	= Context.getDollarSymbol(item);
				}
				count	+= tmp;
			}
		}
		
		return count.toFixed(2);
	},
	
	getDollarSymbol: function(str) {
		var symbolArr	= ['$','€','£','¥','₣','₩'];
		var symbol = '';
		if (!str) return symbol;
		for (var i = 0; i < symbolArr.length; i++) {
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
		return parseFloat(reduce).toFixed(2);
//		if (reduce.toString().length > 10) {
//			reduce	= (num1 * 100 - num2 * 100) / 100;
//			if (reduce.toString().length > 10) {
//				reduce	= (Math.round(num1 * 100) - Math.round(num2 * 100)) / 100;
//			}
//		}
//		if (isNaN(reduce)) reduce = 0;
//		return reduce;
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
	
	getTimeLeft: function(isRemove) {
		var leftSec	= 0;
		if (!Context.applyInfo || !Context.applyInfo.count) return leftSec;
		var data	= Context.applyInfo;
		if (data.codeIndex < 1) {
			leftSec	= data.count * 6;
		} else {
			var curNum	= data.codeIndex;
			if (isRemove) curNum++;
			var avgTime	= Context.getSubTime(data.endTime, data.startTime) / curNum;
			if (data.codeIndex >= data.count) {
				leftSec = avgTime;
			} else {
				leftSec	= avgTime * (data.count - curNum);
			}
		}
		leftSec	= Math.round(leftSec);
		return leftSec;
	},
	
	getSavedText: function() {
		var appInfo	= Context.applyInfo;
		var reduce	= Context.getReduce(appInfo.originalPrice, appInfo.finalPrice);
		var symbol	= appInfo.symbol ? appInfo.symbol : '$';
		var text	= "I just saved "+ symbol + reduce +" on "+ Context.reqData.merName +" with Coupon Digger !";
		return text;
	},
	
	fbShare: function() {
		var savedText	= Context.getSavedText();
		var title=encodeURIComponent(savedText);
		var url=encodeURIComponent("http://www.couponmountain.com/coupondigger.html");
		var summary=encodeURIComponent("Just one click saves you time and money by finding the best coupon codes at checkout.  Don’t search.  Just save!");
		var image=encodeURIComponent("http://files.couponmountain.com/add/cd_259.jpg");
		var left=parseInt(window.innerWidth/2)-320+window.screenX;
		var top=parseInt(window.innerHeight/2)-175+window.screenY+25;

		window.open('http://www.facebook.com/sharer.php?s=100&p[title]='+title+'&p[summary]='+summary+'&p[url]='+url+'&p[images][0]='+image, 'sharer', 
				'toolbar=0,status=0,width=620,height=280,left='+left+',top='+top);
	},
	
	twShare: function() {
		var savedText	= Context.getSavedText();
		var url=encodeURIComponent("http://www.couponmountain.com/coupondigger.html");
		var text=encodeURIComponent(savedText);
		var left=parseInt(window.innerWidth/2)-310+window.screenX;
		var top=parseInt(window.innerHeight/2)-190+window.screenY+25;

		window.open('https://twitter.com/share?url='+url+'&text='+text, 'sharer', 
				'toolbar=0,status=0,width=572,height=378,left='+left+',top='+top);
	},
	
	sendMail: function() {
		var savedText	= Context.getSavedText();
		var subject	= encodeURIComponent(savedText);
		var body	= encodeURIComponent(savedText +".\r\nhttp://www.couponmountain.com/coupondigger.html");
		var link	= "mailto:?subject="+subject+"&body="+body;
		window.location.href = link;
	},
	
	pauseApply: function() {
		if (isPauseApply) {
			// Continue apply
			Context.pauseStatusOff();
			$("#cmus_processPause").text("Pause Saving");
			Context.execute();
		} else {
			// Pause apply
			Context.pauseStatusOn();
			$("#cmus_processPause").text("Continue Saving");
		}
	},
	
	pauseStatusOn: function() {
		isPauseApply	= true;
		//Context.sendRequest({reqType:"savePauseStatus", value:1});
		Context.setStorage("cmusPause", 1);
	},
	
	pauseStatusOff: function() {
		isPauseApply	= false;
		//Context.sendRequest({reqType:"savePauseStatus", value:0});
		Context.setStorage("cmusPause", 0);
	},
	
	initPauseStatus: function() {
		var val	= Context.getStorage("cmusPause");
		isPauseApply	= val == 1 ? true : false;
	},
	
	getStorage: function(key) {
		var val	= null;
		if (!key || typeof key !== "string") return val;
		
		// lowes.com will clear sessionStorage when post request, storage to cookie
		if (Context.reqData && Context.reqData.domain && Context.reqData.domain === "lowes.com") {
			var cval	= Mix.getCookie(key);
			if (cval) val	= cval;
			return val;
		}
		
		// other merchant storag in sessionStorage
		try {
			val	= window.sessionStorage.getItem(key);
		} catch (e) {
			Mix.log("Get session storage error!! KEY=", key, e);
			val	= null;
		}
		return val;
	},
	
	setStorage: function(key, val) {
		var ret	= false;
		if (!key || typeof key !== "string") return ret;
		if (typeof val === "object") {
			try {
				val	= JSON.stringify(val);
			} catch (e) {
				Mix.log("Stringify object with storage error!! key/value:", key, val, e);
				return ret;
			}
		}
		
		// lowes.com will clear sessionStorage when post request, get from cookie
		if (Context.reqData && Context.reqData.domain && Context.reqData.domain === "lowes.com") {
			document.cookie	= escape(key) + "=" + escape(val) + "; path=/; domain=" + document.domain;
			//Mix.setCookie(key, val);
			ret	= true;
			return ret;
		}
		
		// other merchant storag in sessionStorage
		try {
			window.sessionStorage.setItem(key, val);
			ret = true;
		} catch (e) {
			Mix.log("Save session storage error!! key/value:", key, val, e);
			return ret;
		}
		return ret;
	},
	
	setNoPopup: function() {
		Mix.setCookie("cmus_noPopup", 1);
	},
	
	getNoPopup: function() {
		var status	= Mix.getCookie("cmus_noPopup");
		var ret		= false;
		if (status == 1) ret = true;
		return ret;
	},

	clearNoPopup: function() {
		Mix.setCookie("cmus_noPopup", 0);
	}
	
};//End Context object


var Html = {
	buildPopup: function(innerHtml) {
		var html	= '\
			<div class="cmus_popup_wp" id="cmusOutWp">\
				<div class="cmus_popup">\
					<div class="cmus_popup_mask"></div>\
					<div class="cmus_popup_close"></div>\
					<div class="cmus_popup_content">\
						<div class="cmus_coupon">\
						';
			html	+= innerHtml;
			html	+= '\
						</div>\
						<div class="cmus_tips"><div>Fun Fact:</div> Consumers saved $3.7 billion using coupons in 2012.</div>\
					</div>\
				</div>\
			</div>\
						';
//			<div class="cmus_iframe"><iframe src="" style="display:none" id="cmus_callLink"></iframe></div>\
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
				<div class="cmus_findsavings">Find Savings.</div>\
				<div class="cmus_choose_but">\
					<div class="cmus_but_yes" id="cmus_autoApplyBtn"><div>Yes</div></div>\
					<div class="cmus_but_no" id="cmus_closeMainBtn"><div>No</div></div>\
				</div>\
			</div>\
						';
		var html	= Html.buildPopup(innerHtml);	
		return html;
	},
	
	getProcess: function(isRemove) {
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var curNum		= appInfo.codeIndex + 1;
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var count		= appInfo.count;
		var timeLeft	= Context.getTimeLeft(isRemove);
		if (isRemove) curNum++;
		if (curNum < 1) {
			curNum	= 1;
		} else if (curNum > count) {
			curNum = count;
		}
		var processNum	= curNum > 1 ? curNum - 1 : 0.5;
		var percent		= Math.round(processNum / count * 100);
		var stopBtn		= '<div class="cmus_process_stop" id="cmus_processStop">Stop Saving</div>';
		if (Context.reqData.pauseSwitch == 1) {
			var btnText	= isPauseApply ? 'Continue Saving' : 'Pause Saving';
			stopBtn		= '<div class="cmus_process_stop" id="cmus_processPause">'+ btnText +'</div>';
		}
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
					<div class="cmus_process_bottom">'+ stopBtn +'\
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
					" <div>'+Context.applyInfo.applyCode+'</div> " for you.\
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
				<div class="cmus_savemoney">Original Price: <div class="cmus_originalprice">'+origPrice+'</div>\
					Latest Price: <div class="cmus_latestprice">'+finalPrice+'</div></div>\
				<div class="cmus_share_but">\
					<div class="cmus_share_but_content">\
						<div class="sharesavings_txt">Share Savings:</div>\
						<div class="cmus_but_facebook"></div>\
						<div class="cmus_but_twitter"></div>\
						<div class="cmus_but_email"></div>\
					</div>\
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
		if (isForceClosed === true) return ;
		var leftPos	= Mix.getNum(Mix.getCookie('cmus_leftPos'));
		var topPos	= Mix.getNum(Mix.getCookie('cmus_topPos'));
		if (leftPos && topPos) {
			$(".cmus_popup_wp").css({left: leftPos, top: topPos, display:'block'});
		} else {
			$(".cmus_popup_wp").css({display:'block'});
		}
	},
	hideMain: function(isAutoClose) {
		$(".cmus_popup_wp").css({display:'none'});
		Context.clearApplyInfo();
		isForceClosed	= true;
//		// Don't show next time
//		Context.setNoPopup();
		// If is reflash apply code, don't show popup next time
		if (isAutoClose === true && Context.applyType === VERIFY_TYPE_REFLASH) Context.setNoPopup();
	},
	
	showResult: function() {
		var appInfo		= Context.applyInfo;
		var origPrice	= appInfo.originalPrice;
		var finalPrice	= appInfo.finalPrice;
		var reduce		= Context.getReduce(origPrice, finalPrice);
		var symbol		= appInfo.symbol ? appInfo.symbol : '$';
		var innerHtml	= '';
		if (reduce > 0) {
			if(!appInfo.discount) {
				//Context.applyInfo.discount	= reduce;
				Context.saveApplyInfo({discount: reduce});
			}
			innerHtml	= Html.getCongratulation(symbol+reduce, symbol+origPrice, symbol+finalPrice);
		} else {
			if (appInfo.isApply) {
				// If try more than once and doesn't save money, don't show result popup
				Animate.hideMain(true);
				return ;
			} else {
				innerHtml	= Html.getSorry();
			}
		}
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	},
	
	showProcess: function(isRemove) {
		var innerHtml	= Html.getProcess(isRemove);
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	},
	
	showApply: function() {
		var innerHtml	= Html.getApply();
		$(".cmus_coupon").html(innerHtml);
		Animate.showMain();
	}
};//End Animate object


dragDrop = {
	//keyHTML: '<a href="#" class="keyLink">#</a>',
	keyHTML: '',
	keySpeed: 10, // pixels per keypress event
	initialMouseX: undefined,
	initialMouseY: undefined,
	startX: undefined,
	startY: undefined,
	dXKeys: undefined,
	dYKeys: undefined,
	draggedObject: undefined,
	movable: undefined,
	initElement: function (handle, movable) {
		if (typeof handle == 'string') {
			handle = document.getElementById(handle);
		}
		if (typeof movable == 'string') {
			dragDrop.movable = document.getElementById(movable);
		} else if (typeof movable == 'object') {
			dragDrop.movable = movable;
		} else {
			dragDrop.movable = handle;
		}
		handle.onmousedown = dragDrop.startDragMouse;
		handle.style.cursor = 'move';
		/* element.innerHTML += dragDrop.keyHTML;
		var links = element.getElementsByTagName('a');
		var lastLink = links[links.length-1];
		lastLink.relatedElement = element;
		lastLink.onclick = dragDrop.startDragKeys; */
	},
	startDragMouse: function (e) {
		dragDrop.startDrag(dragDrop.movable);
		var evt = e || window.event;
		dragDrop.initialMouseX = evt.clientX;
		dragDrop.initialMouseY = evt.clientY;
		dragDrop.addEventSimple(document,'mousemove',dragDrop.dragMouse);
		dragDrop.addEventSimple(document,'mouseup',dragDrop.releaseElement);
		return false;
	},
	startDragKeys: function () {
		dragDrop.startDrag(this.relatedElement);
		dragDrop.dXKeys = dragDrop.dYKeys = 0;
		dragDrop.addEventSimple(document,'keydown',dragDrop.dragKeys);
		dragDrop.addEventSimple(document,'keypress',dragDrop.switchKeyEvents);
		this.blur();
		return false;
	},
	startDrag: function (obj) {
		if (dragDrop.draggedObject)
			dragDrop.releaseElement();
		dragDrop.startX = obj.offsetLeft;
		dragDrop.startY = obj.offsetTop;
		dragDrop.draggedObject = obj;
		obj.className += ' dragged';
	},
	dragMouse: function (e) {
		var evt = e || window.event;
		var dX = evt.clientX - dragDrop.initialMouseX;
		var dY = evt.clientY - dragDrop.initialMouseY;
		dragDrop.setPosition(dX,dY);
		return false;
	},
	dragKeys: function(e) {
		var evt = e || window.event;
		var key = evt.keyCode;
		switch (key) {
			case 37:	// left
			case 63234:
				dragDrop.dXKeys -= dragDrop.keySpeed;
				break;
			case 38:	// up
			case 63232:
				dragDrop.dYKeys -= dragDrop.keySpeed;
				break;
			case 39:	// right
			case 63235:
				dragDrop.dXKeys += dragDrop.keySpeed;
				break;
			case 40:	// down
			case 63233:
				dragDrop.dYKeys += dragDrop.keySpeed;
				break;
			case 13: 	// enter
			case 27: 	// escape
				dragDrop.releaseElement();
				return false;
			default:
				return true;
		}
		dragDrop.setPosition(dragDrop.dXKeys,dragDrop.dYKeys);
		if (evt.preventDefault)
			evt.preventDefault();
		return false;
	},
	setPosition: function (dx,dy) {
		dragDrop.draggedObject.style.left = dragDrop.startX + dx + 'px';
		dragDrop.draggedObject.style.top = dragDrop.startY + dy + 'px';
	},
	switchKeyEvents: function () {
		// for Opera and Safari 1.3
		dragDrop.removeEventSimple(document,'keydown',dragDrop.dragKeys);
		dragDrop.removeEventSimple(document,'keypress',dragDrop.switchKeyEvents);
		dragDrop.addEventSimple(document,'keypress',dragDrop.dragKeys);
	},
	releaseElement: function () {
		dragDrop.removeEventSimple(document,'mousemove',dragDrop.dragMouse);
		dragDrop.removeEventSimple(document,'mouseup',dragDrop.releaseElement);
		dragDrop.removeEventSimple(document,'keypress',dragDrop.dragKeys);
		dragDrop.removeEventSimple(document,'keypress',dragDrop.switchKeyEvents);
		dragDrop.removeEventSimple(document,'keydown',dragDrop.dragKeys);
		dragDrop.draggedObject.className = dragDrop.draggedObject.className.replace(/dragged/,'');
		dragDrop.draggedObject = null;
	},
	addEventSimple: function (obj,evt,fn) {
		if (obj.addEventListener)
			obj.addEventListener(evt,fn,false);
		else if (obj.attachEvent)
			obj.attachEvent('on'+evt,fn);
	},
	removeEventSimple: function (obj,evt,fn) {
		if (obj.removeEventListener)
			obj.removeEventListener(evt,fn,false);
		else if (obj.detachEvent)
			obj.detachEvent('on'+evt,fn);
	}
};


var ApplyInteract	= {
	listener: function() {
		var isListening	= false;
		var popupHandle	= null;
		popupHandle	= setInterval(function(){
			var $popupDom	= $(".cmus_popup_wp");
			if ($popupDom.length > 0) {
				clearInterval(popupHandle);
				if (isListening) return ;
				isListening	= true;
				if (typeof $popupDom.on == "function" || typeof $popupDom.live == "function") {
					$popupDom.drags({handle:'.cmus_cmlogo'});
				} else {
					setTimeout(function(){
						$popupDom.drags({handle:'.cmus_cmlogo'});
					}, 1000);
				}
				if (typeof $popupDom.on == "function") {
					// jQuery version >= 1.7
					$popupDom.on('click', '#cmus_autoApplyBtn', Context.execute)
					.on('click', '#cmus_closeMainBtn, .cmus_popup_close, #cmus_processStop', Animate.hideMain)
					.on('click', '#cmus_processPause', Context.pauseApply)
					.on('click', '.cmus_cmlink', Context.gotoCM)
					.on('click', '.cmus_but_facebook', Context.fbShare)
					.on('click', '.cmus_but_twitter', Context.twShare)
					.on('click', '.cmus_but_email', Context.sendMail);
				} else if (typeof $popupDom.live == "function") {
					$('#cmus_autoApplyBtn').live('click', Context.execute);
					$('#cmus_closeMainBtn, .cmus_popup_close, #cmus_processStop').live('click', Animate.hideMain);
					$('#cmus_processPause').live('click', Context.pauseApply);
					$('.cmus_cmlink').live('click', Context.gotoCM);
					$('.cmus_but_facebook').live('click', Context.fbShare);
					$('.cmus_but_twitter').live('click', Context.twShare);
					$('.cmus_but_email').live('click', Context.sendMail);
				} else {
					setTimeout(function(){
						$('#cmus_autoApplyBtn').click(Context.execute);
						$('#cmus_closeMainBtn, .cmus_popup_close, #cmus_processStop').click(Animate.hideMain);
						$('#cmus_processPause').click(Context.pauseApply);
						$('.cmus_cmlink').click(Context.gotoCM);
						$('.cmus_but_facebook').click(Context.fbShare);
						$('.cmus_but_twitter').click(Context.twShare);
						$('.cmus_but_email').click(Context.sendMail);
					}, 800);
				}
			}
		}, 200);
	},
	
	withChrome: function() {
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
		
		$(document).ready(function(){
			Context.init();
			ApplyInteract.listener();
		});
	},
	
	withFirefox: function() {
		self.port.on('onGetCoupon',function(res){
			Context.reqData = res;
			Context.init();
			ApplyInteract.listener();
		});
	},
	
	withSafari: function() {
		safari.self.addEventListener("message", function(evt){
			var data = evt.message;
			switch (evt.name) {
				case 'onGetCoupon':
					Mix.log(data);
					Context.reqData = data;
					Context.init();
					ApplyInteract.listener();
					break;
				default:
					break;
			}
			if(typeof Context[evt.name+'Handler']==='function')
					Context[evt.name+'Handler'](data);
		}, false);
		safari.self.tab.dispatchMessage("onGetCoupon", {reqType:'getCoupon'});
		safari.self.tab.dispatchMessage("onLog", {reqType:'log',isShowLog:Mix.getCookie('isLogTestInfo') || false});
	},
	
	withIE: function() {
		if (!cm_couponInfo) {
			setTimeout(ApplyInteract.withIE, 200);
			return;
		}
		Context.reqData = fixIEData(cm_couponInfo);
		Context.init();
		ApplyInteract.listener();
	}
};


function fixIEData(data) {
	if (!data || !data.pageRegular) return data;
	
	data.pageRegular.inputXpath		= data.pageRegular.inputSelector;
	data.pageRegular.priceXpath		= data.pageRegular.priceSelector;
	data.pageRegular.removeXpath	= data.pageRegular.removeSelector;
	data.pageRegular.submitXpath	= data.pageRegular.submitSelector;
	
	if (Mix.empty(data.pageRegular.priceXpath)) {
		switch (data.domain) {
			case "hp.com":
				// https
				data.pageRegular.inputXpath		= "input[name='BILLING.couponCode']";
				data.pageRegular.priceXpath		= "#order-subtotal-td";
				data.pageRegular.removeXpath	= "#couponButton";
				data.pageRegular.submitXpath	= "#coupon-apply-tr2 > td > a";
				break;
			case "lampsplus.com":
				data.pageRegular.inputXpath		= "#txtPromoCode";
				data.pageRegular.priceXpath		= "span.GrandTotal";
				data.pageRegular.removeXpath	= "#btnRemovePromoCode";
				data.pageRegular.submitXpath	= "#ibPromoCode";
				break;
			case "purecollection.com":
				data.pageRegular.inputXpath		= "#txtPromoCode";
				data.pageRegular.priceXpath		= "#Basket_TotalLine > td:last";
				data.pageRegular.removeXpath	= "#Basket_PromotionalCodesLine > td:eq(1) > p > a";
				data.pageRegular.submitXpath	= "#Basket_PromotionalCodesLine > td > a";
				break;
			case "macys.com":
				data.pageRegular.inputXpath		= "#promoCode";
				data.pageRegular.priceXpath		= "#bagTotal";
				data.pageRegular.removeXpath	= "#removePromoCode";
				data.pageRegular.submitXpath	= "#applyPromoCode";
				break;
			case "overstock.com":
				// https
				data.pageRegular.inputXpath		= "#PromoCode";
				data.pageRegular.priceXpath		= "#orderTotalDisplayAmount";
				data.pageRegular.removeXpath	= "";
				data.pageRegular.submitXpath	= "#promoCodeApply";
				break;
			case "jimmyjazz.com":
				data.pageRegular.inputXpath		= "input.promotion";
				data.pageRegular.priceXpath		= "span.total";
				data.pageRegular.removeXpath	= "";
				data.pageRegular.submitXpath	= "img.promotion_submit";
				break;
			default:
				break;
		}
	}
	
	return data;
}




var cm_check_jq_times	= 0;
var cm_is_inject_jq		= false;
function cm_init_execute() {
	if ((typeof jQuery != "function")) {
		if (++cm_check_jq_times > 10 && !cm_is_inject_jq) {
			cm_is_inject_jq	= true;
			CMUS_Inject.jquery(true);
		}
		setTimeout(cm_init_execute, 200);
		return;
	}
	jQuery.fn.drags = function(opt) {
		opt = jQuery.extend({handle: "", cursor: "move"}, opt);
		var $drag	= $(this);
		
		if (typeof $drag.on == "function") {
			// jQuery version >= 1.7
			$drag.on("mousedown", opt.handle, function(e) {
				$drag.addClass('draggable');
				var z_idx = $drag.css('z-index'),
					drg_h = $drag.outerHeight(),
					drg_w = $drag.outerWidth(),
					pos_y = $drag.offset().top + drg_h - e.pageY,
					pos_x = $drag.offset().left + drg_w - e.pageX;
				$drag.css('z-index',999990).parents().on("mousemove", function(e) {
					$('.draggable').offset({
						top: e.pageY + pos_y - drg_h,
						left: e.pageX + pos_x - drg_w
					}).on("mouseup", function() {
						$(this).removeClass('draggable').css('z-index', z_idx);
					});
				});
				e.preventDefault(); // disable selection
			}).on("mouseup", opt.handle, function() {
				var left	= $drag.offset().left;
				var top		= $drag.offset().top;
				Mix.setCookie('cmus_leftPos', left);
				Mix.setCookie('cmus_topPos', top);
				
				$drag.removeClass('draggable');
			}).on("mouseover", opt.handle, function(){
				$drag.find(opt.handle).css('cursor', opt.cursor);
			});
		} else if (typeof $drag.live == "function") {
			// jQuery version >=1.3 && < 1.7
			var $handle	= (opt.handle == "") ? $drag : $(opt.handle);
			$handle.live("mousedown", function(e) {
				$drag.addClass('draggable');
				var z_idx = $drag.css('z-index'),
					drg_h = $drag.outerHeight(),
					drg_w = $drag.outerWidth(),
					pos_y = $drag.offset().top + drg_h - e.pageY,
					pos_x = $drag.offset().left + drg_w - e.pageX;
				$drag.css('z-index',999990).parents().mousemove(function(e) {
					$('.draggable').css({
						top: e.pageY + pos_y - drg_h,
						left: e.pageX + pos_x - drg_w
					}).mouseup(function() {
						$(this).removeClass('draggable').css('z-index', z_idx);
					});
				});
				e.preventDefault(); // disable selection
			}).live("mouseup", function() {
				var left	= $drag.offset().left;
				var top		= $drag.offset().top;
				Mix.setCookie('cmus_leftPos', left);
				Mix.setCookie('cmus_topPos', top);
				
				$drag.removeClass('draggable');
			}).live("mouseover", function(){
				$(this).css('cursor', opt.cursor);
			});
		} else {
			var $handle	= (opt.handle == "") ? $drag : $(opt.handle);
			dragDrop.initElement($handle[0], $drag[0]);
			/*var $handle	= (opt.handle == "") ? $drag : $(opt.handle);
			$handle.mousedown(function(e) {
				$drag.addClass('draggable');
				var z_idx = $drag.css('z-index'),
					pos_y = e.pageY - $drag.css('top'),
					pos_x = e.pageX - $drag.css('left');
				Mix.log("left/top: "+ $drag.css('left') +'----'+ $drag.css('top'));
				Mix.log("pageX/pageY: "+ e.pageX +'----'+ e.pageY);
				
				$drag.css('z-index',999990).parents().mousemove(function(e) {
					Mix.log("===== pageX/pageY: "+ e.pageX +'----'+ e.pageY);
					$('.draggable').css({
						top: e.pageY - pos_y,
						left: e.pageX - pos_x
					}).mouseup(function() {
						$(this).removeClass('draggable').css('z-index', z_idx);
					});
				});
				e.preventDefault(); // disable selection
			}).mouseup(function() {
				var left	= $drag.offset().left;
				var top		= $drag.offset().top;
				Mix.setCookie('cmus_leftPos', left);
				Mix.setCookie('cmus_topPos', top);
				
				$drag.removeClass('draggable');
			}).mouseover(function(){
				$(this).css('cursor', opt.cursor);
			});*/
		}
	};

	explorerType	= Context.getExplorer();
	switch (explorerType) {
		case 'chrome':
			ApplyInteract.withChrome();
			break;
		case 'firefox':
			ApplyInteract.withFirefox();
			break;
		case 'ie':
			ApplyInteract.withIE();
			break;
		case 'safari':
			ApplyInteract.withSafari();
			break;
		default :
			Mix.log('Unexpect explorer, not chrome/firefox/ie/safari explorer, stop excute.......');
			break;
	}
}
cm_init_execute();


}//end inject
}else{
	Mix.log('Iframe loading!');
}