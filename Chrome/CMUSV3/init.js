var curTabUrl	= "",
	curTabId	= 0;

chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
	var tabUrl	= Request.tabUrl ? Request.tabUrl : "";
	var tabId	= Request.tabId ? Request.tabId : 0;
	var retVal	= 0;
	switch (Request.reqType) {
		case "storeApplyInfo":
			retVal	= Storage.saveApplyInfo(Request.info);
			retVal	= retVal ? 0 : -1;
			sendResponse({ret:retVal});
			break;
		case "getApplyInfo":
			retVal	= Storage.getApplyInfo();
			sendResponse(retVal);
			break;
		case "logUseInfo":
			Ajax.sendUseInfo(tabUrl, tabId, {useinfo:Request.info}, function(Data){
				sendResponse(Data);
			});
			break;
		case "callIframe":
			Init.callIframe(Request.callUrl);
			break;
		case "openLink":
			chrome.tabs.create({url: Request.tagUrl, active: true});
			break;
		case "saveStorage":
			retVal	= Storage.save(Request.key, Request.value);
			sendResponse({ret: retVal});
			break;
		case "getStorage":
			retVal	= Storage.get(Request.key, Request.value);
			sendResponse({ret: retVal});
			break;
		case "logErrorXpath":
				Ajax.sendErrorXpath(tabUrl, tabId, Mix.formatErrorXpath(Request.error), Request.merRuleId, function(Data){
					sendResponse(Data);
				});
			break;
		case "reloadCoupon":
			Coupon.reloadCoupon();
			break;
		case "savePauseStatus":
			retVal	= Storage.savePauseStatus(Request.value);
			sendResponse({ret: retVal});
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
	
	callIframe: function(url) {
		$("#bgCallUrl").attr("src", url);
	},
	
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
				Init.storeUuid();
				//Init.openTutorial();
				Init.saveJsFile();
				Init.saveCssFile();
			}
			
			Init.setIntevalExec();
		});
	},
	
	storeUuid: function() {
		var version	= Storage.getLastVersion();
		if (!version) {
			version	= Mix.getVersion();
			Storage.saveVersion(version);
		}
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
	}
};



document.addEventListener('DOMContentLoaded', function(){
	Storage.getUuid();
	Init.exec();
	chrome.tabs.onUpdated.addListener(Coupon.display);
});
