var curTabUrl	= "",
	curTabId	= 0;

chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
	var tabUrl	= Request.tabUrl ? Request.tabUrl : "";
	var tabId	= Request.tabId ? Request.tabId : 0;
	var retVal	= 0;
	switch (Request.reqType) {
		case "copyCode":
			var res	= false;
			if (Request.code.length > 0) {
				res	= Mix.copy(Request.code);
			}
			sendResponse({ret:res});
			break;
		case "storeApplyInfo":
			retVal	= Storage.saveApplyInfo(Request.info);
			retVal	= retVal ? 0 : -1;
			sendResponse({ret:retVal});
			break;
		case "getApplyInfo":
			retVal	= Storage.getApplyInfo();
			sendResponse(retVal);
			break;
		case "getClickedMerId":
			var merIds	= Storage.getClickedPushMerId();
			sendResponse({ret: 0, merIds: merIds});
			break;
		case "pushClick":
			Storage.saveClickedPushMerId(Request.merId);
			// Open tagUrl
			chrome.tabs.create({url: Request.tagUrl, active: true});
			Ajax.sendPushClick(tabUrl, tabId, Request.merId, function(Data){
				sendResponse(Data);
			});
			break;
		case "removeClickedMerId":
			var result	= Storage.removeClickedPushMerId(Request.merId);
			retVal	= result ? 0 : -1;
			sendResponse({ret: retVal});
			break;
		case "getSeNumCoupon":
			chrome.tabs.get(tabId, function(tab){
				Ajax.getUrlCoupon(Request.tagUrl, tab.id, tab.windowId, false, true, function(Data){
					sendResponse(Data);
				});
			});
			break;
		case "addFavorite":
			Ajax.addFavorite(tabUrl, tabId, Request.merId, function(Data){
				sendResponse(Data);
			});
			break;
		case "removeFavorite":
			Ajax.removeFavorite(tabUrl, tabId, Request.merId, function(Data){
				sendResponse(Data);
			});
			break;
		case "getFavorites":
			Ajax.getFavorite(tabUrl, tabId, function(Data){
				Data.status	= Storage.getPushStatus();
				sendResponse(Data);
			});
			break;
		case "snoozePush":
			Ajax.snoozeFavorite(tabUrl, tabId, Request.merId, Request.snoozeTime, function(Data){
				sendResponse(Data);
			});
			break;
		case "logErrorXpath":
				Ajax.sendErrorXpath(tabUrl, tabId, Mix.formatErrorXpath(Request.error), Request.merRuleId, function(Data){
					sendResponse(Data);
				});
			break;
		case "turnOnPush":
			var ret	= Storage.savePushStatus("on");
			if (ret) Init.setIntevalPush();
			retVal	= ret ? 0 : -1;
			sendResponse({ret: retVal});
			break;
		case "turnOffPush":
			var ret2	= Storage.savePushStatus("off");
			if (ret2) Init.clearIntevalPush();
			retVal	= ret2 ? 0 : -1;
			sendResponse({ret: retVal});
			break;
		case "reloadCoupon":
			Coupon.reloadCoupon();
			break;
		default:
			sendResponse({ret: -1});
			break;
	}
});

var Init = {
	reqInitHandle: null,
	reqJSHandle: null,
	reqCSSHandle: null,
	reqPushHandle: null,
	isFirstExec: true,
	
	exec: function() {
		Ajax.getInitFile(curTabUrl, curTabId, function(Res){
			if (!Res || Res.ret != 0) {
				Init.setIntevalExec();
				return ;
			}
			
			Init.clearIntevalExec();
			Storage.saveReqInitTime(Init.convertToSec(Res.initReqTime));
			Storage.saveReqJsTime(Init.convertToSec(Res.jsReqTime));
			Storage.saveReqCssTime(Init.convertToSec(Res.cssReqTime));
			Storage.saveReqPushTime(Init.convertToSec(Res.pushReqTime));
			Storage.saveTutorialUrl(Res.tutorial);
			
			if (Init.isFirstExec) {
				Init.isFirstExec	= false;
				Init.openTutorial();
				Init.saveJsFile();
				Init.saveCssFile();
				Init.pushCoupon();
			}
			
			Init.setIntevalExec();
		});
	},
	
	setIntevalExec: function() {
		Init.reqInitHandle = setTimeout(Init.exec, Storage.getReqInitTime());
	},
	clearIntevalExec: function() {
		clearTimeout(Init.reqInitHandle);
	},
	
	convertToSec: function(num) {
		num	= parseInt(num);
		if (Number.isNaN(num)) {
			num	= 0;
		} else {
			num *= 1000;
		}
		return num;
	},
	
	openTutorial: function() {
		var lastVersion	= Storage.getLastVersion();
		var curVersion	= Mix.getVersion();
		Mix.log("last version: "+ lastVersion, "Current version: "+ curVersion);
		
		if (lastVersion != curVersion) {
			var tutorial	= Storage.getTutorialUrl();
			if (!tutorial || tutorial.length < 5) return ;
			chrome.tabs.create({url:tutorial, active:true}, function(){
				Storage.saveVersion(curVersion);
			});
		}
	},
	
	saveJsFile: function() {
		Ajax.getJsFile(curTabUrl, curTabId, function(codes){
			if (codes && typeof codes == "string" && codes.length > 10) {
				var result	= Storage.saveJsFile(codes);
				Mix.log("Save JS file result: "+ result);
			}
			Init.clearIntevalJS();
			Init.setIntevalJS();
		});
	},
	
	saveCssFile: function() {
		Ajax.getCssFile(curTabUrl, curTabId, function(codes){
			if (codes && typeof codes == "string" && codes.length > 10) {
				var result	= Storage.saveCssFile(codes);
				Mix.log("Save CSS file result: "+ result);
			}
			Init.clearIntevalCSS();
			Init.setIntevalCSS();
		});
	},
	
	setIntevalJS: function() {
		Init.reqJSHandle = setTimeout(Init.saveJsFile, Storage.getReqJsTime());
	},
	clearIntevalJS: function() {
		clearTimeout(Init.reqJSHandle);
	},
	
	setIntevalCSS: function() {
		Init.reqCSSHandle = setTimeout(Init.saveCssFile, Storage.getReqCssTime());
	},
	clearIntevalCSS: function() {
		clearTimeout(Init.reqCSSHandle);
	},
	
	setIntevalPush: function() {
		Init.reqPushHandle	= setTimeout(Init.pushCoupon, Storage.getReqPushTime());
	},
	clearIntevalPush: function() {
		clearTimeout(Init.reqPushHandle);
	},
	
	pushCoupon: function() {
		Mix.log("Push coupon");
		if (Storage.getPushStatus() == "off") return ;
		Init.clearIntevalPush();
		
		chrome.tabs.getSelected(null, function(tab){
			if (!tab.url || tab.url.indexOf("http") !== 0) { return ;}
			
			// Request push coupons
			Ajax.getPushCoupon(tab.url, tab.id, function(Res){
				Res.reqType	= PT_UPDATE_PUSH;
				chrome.tabs.sendRequest(tab.id, Res);
			});
		});
		Init.setIntevalPush();
	}
};



document.addEventListener('DOMContentLoaded', function(){
	Storage.getUuid();
	Init.exec();
	chrome.tabs.onUpdated.addListener(Coupon.display);
});
