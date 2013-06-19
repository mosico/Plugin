var CmusMain = {
	
	isShowLog: false,
	bgTab:'',
	uuid: Math.uuid(),
	version: safari.extension.displayVersion || '1.1.2013.5024',
	
	log: function(){
		if(this.isShowLog)
			console.log.apply(console,arguments);
	},

	setStorage: function(key,value){
		localStorage.setItem(key, JSON.stringify(value));
	},

	getStorage: function(key){
		return localStorage.getItem(key) !== undefined ? JSON.parse(localStorage.getItem(key)) : false;	
	},

	pageWorker: function(url){
		var t = this;
		t.log('[PW URL]:', url);
		if(url && url.indexOf('http') !==0)
			return;
		//t.bgTab = t.bgTab && t.bgTab.browserWindow ? t.bgTab : safari.application.activeBrowserWindow.openTab('background');
		//t.bgTab.url = url;
	},

	urlRequest: function(obj,cb){
		var t = this;
		t.log('[UR URL]:', obj.url);
		if(obj.url && obj.url.indexOf('http') !==0)
			return;
		
		obj.data = obj.data || {};
		obj.data.version = t.version;
		obj.data.uuid = t.uuid;
		t.log('[UR DATA]:', obj.data);
		$.ajax({
	    	"url": obj.url+(!obj.cache ? "" : (obj.url.indexOf("?") > -1 ? '&' : '?') + "_=" + new Date().getTime()),
	    	"type": obj.type || 'post',
	    	"data": obj.data,
			"dataType": obj.dataType || 'json',
			"timeout": REQUEST_TIMEOUT,
			"cache": obj.cache || false,
			"success": function(res) {
				if(typeof cb !== 'function')
						return;
				cb(res);
			}
		});	
	},

	convertToSec: function(num) {
		num	= parseInt(num);
		if (isNaN(num)) {
			num	= 0;
		} else {
			num *= 1000;
		}
		return num;
	},

	setOption: function(){

	},	

	getFile: function(url,key){
		var t = this;
		t.urlRequest({url:url,dataType:'text',cache:true}, function(response) {
			t.setStorage(key,response);
		});
	},

	getInit: function(){
		var t = this;
		t.urlRequest({url:REQUEST_INIT_URL}, function(response) {
			t.setStorage('cssReqTime',t.convertToSec(response.cssReqTime));
			t.setStorage('initReqTime',t.convertToSec(response.initReqTime));
			t.setStorage('jsReqTime',t.convertToSec(response.jsReqTime));
			t.setStorage('pushReqTime',t.convertToSec(response.pushReqTime));
		});
	},

	onMessage: function(evt){
		var t = this
			,ret={ret:0}
			,data = evt.message
			;
		if(data.callback)
			ret.callback = data.callback;
		switch (data.reqType) {
			case "storeApplyInfo":
				t.setStorage('curApplyInfo',data.info)
				evt.target.page.dispatchMessage(evt.name, ret);
				break;
			case "getApplyInfo":
				ret = t.getStorage('curApplyInfo');
				evt.target.page.dispatchMessage(evt.name, ret||{});
				break;
			case "logUseInfo":
				t.urlRequest({
					url:LOG_USE_INFO_URL,
					data:{useinfo: data.info}
				},function(res){
					if(data.callback)
						res.callback = data.callback;
					evt.target.page.dispatchMessage(evt.name,res);
				});
				break;
			case "openLink":
				safari.application.activeBrowserWindow.openTab().url = data.tagUrl;
				break;
			case "callIframe":
				t.pageWorker(data.callUrl);
			case "getCoupon":
				this.urlRequest({
						url:REQUEST_COUPON_URL,
						data:{url:evt.target.url, referType:4} 
					}, function(res){
						if(!res || !res.count){
							t.log('[GET COUPON]:', 'No coupon!');
							return;
						}
						t.log('[COUPON INFO]:', res);
						evt.target.page.dispatchMessage(evt.name, res);
				});
			case "log":
				t.isShowLog = data.isShowLog;
			default:
				break;
		}
	},

	run: function(){
		var t = this;
		t.log('[WINDOW]:','Running...');
		t.getFile(REQUEST_JS_URL,'js');
		t.getFile(REQUEST_CSS_URL,'css');
		t.getInit();
		t.setOption();
		
		var jsCode = t.getStorage('js') || ''
			,cssCode = t.getStorage('css') || ''
			;

		if(!jsCode || !cssCode){
			t.log('[JS CSS]:', 'Js or css load error!');
			return;
		}

		safari.extension.addContentScript("$('<style>').appendTo('head').html('"+cssCode.replace(/[\r\n]/g,' ').replace("'","\\'")+"');"+jsCode,null,null,true);
		//safari.extension.addContentStyleSheet(cssCode);
		safari.application.addEventListener("message", function(evt){
			t.onMessage(evt);
		}, false);
	}
}

CmusMain.run();