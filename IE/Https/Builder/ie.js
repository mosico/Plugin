var cm_couponInfo	= null;

var CMUS_Inject = {
	init: function() {
		this.css(CM_CSS_URL);
		this.jquery();
		this.iframe();
		this.output();
	},
	
	css: function(url) {
		var link	= document.createElement("link");
		link.type	= "text/css";
		link.rel	= "stylesheet";
		link.href	= url;
		document.getElementsByTagName('head')[0].appendChild(link);
	},
	
	jquery: function(isForceInject) {
		// blair.com can't has jQuery.live or jQuery.on, need inject
		// if (isForceInject !== true)	isForceInject	= document.location.href.indexOf('blair.com') > 0 ? true : false;
		if (typeof jQuery != "function" || isForceInject) {
			this.js(CM_JQ_URL);
		}
	},
	
	js: function(url) {
		var script	= document.createElement("script");
		script.type	= "text/javascript";
		script.src	= url;
		document.getElementsByTagName('head')[0].appendChild(script);
	},
	
	html: function() {
		var tit	= document.title;
		var div	= document.createElement("div");
		div.className	= "cmus_wrapper";
		div.innerHTML	= '<div id="cmusDiv">Inject Frome CMUS @ '+ tit +'</div>';
		document.body.appendChild(div);
	},
	
	iframe: function() {
		var url	= CM_IFRAME_URL +"?u="+ cmus_uuid +"&v="+ cmus_version;
		var div	= '<div class="cmus_iframediv" style="display:none;"><iframe id="cmusIframe" src="'+ url +'"></iframe></div>';
		document.body.insertAdjacentHTML("afterbegin", div);
	},
	
	output: function() {
		if (Mix.getCookie('isLogTestInfo') != 1) return;
		document.body.insertAdjacentHTML("afterbegin", '<div class="cmus_output_wp"><pre id="cmusOutput"></pre></div>');
	}
};


var CMUS_Message	= {
	messenger: null,
	hasReqCode: false,
	init: function()
	{
		try {
			var msgIframe	= document.getElementById('cmusIframe');
			if (!msgIframe || !msgIframe.contentWindow) {
				throw new Error("message iframe window can't init");
			}
			CMUS_Message.messenger = Messenger.initInParent(msgIframe);
		} catch (e) {
			//alert(e.toString());
			setTimeout(CMUS_Message.init, 100);
			return;
		}
		
		CMUS_Message.messenger.onmessage = CMUS_Message.listening;
		CMUS_Message.sendVar();
		CMUS_Message.checkReqCode();
	},
	
	listening: function(data) {
		var newline	= '\n';
		var text	= document.createTextNode(data + newline);
//		document.getElementById('cmusOutput').appendChild(text);
		Mix.log(text);
		
		if (data && typeof data == "string") {
			try {
				var D	= JSON.parse(data);
				if (D.msgType && D.msgType == "couponInfo") {
					CMUS_Message.hasReqCode	= true;
					cm_couponInfo	= D;
				}
			} catch (e) {
				
			}
		}
	},
	
	sendVar: function() {
		if(!cmus_version || !cmus_uuid) {
			setTimeout(CMUS_Message.sendVar, 200);
			return;
		}
		var msg		= {type: "getCoupon", version: cmus_version, uuid: cmus_uuid, url: location.href};
		var msgStr	= JSON.stringify(msg);
		CMUS_Message.messenger.send(msgStr);
	},
	
	checkReqCode: function() {
		if (CMUS_Message.hasReqCode) return;
		CMUS_Message.sendVar();
		setTimeout(CMUS_Message.checkReqCode, 100);
	},
	
	sendUseInfo: function(msg) {
		if (msg && typeof msg === "object" && msg.length === undefined) {
			msg.type	= "logUseInfo";
			var msgStr	= JSON.stringify(msg);
			CMUS_Message.messenger.send(msgStr);
			Mix.log("------ Log code use info -------: ", msgStr);
		}
	}
};


var cmInjectedObj	= document.getElementById('cmusOutWp');
if (cmInjectedObj == null ) {
	CMUS_Inject.init();
	CMUS_Message.init();
} else {
	IS_INJECT_CONTENT_PAGE	= true;
}


