var Storage = {
		
	// Delete current url's coupon info
	deleteUrlCouponInfo: function(url) {
		var ret	= false;
		var curDomain	= getUrlDomain(url);
		if (!curDomain) return ;
		ret	= localStorage.removeItem(curDomain);
		return ret;
	},
	
	
	/****************************************   String storage <start>   *******************************************/
	saveString: function(key, value, isNoEmpty) {
		var ret		= false;
		var canSave	= true;
		if (!key || typeof key != "string" || typeof value != "string") return ret;
		if (isNoEmpty && Mix.empty(value)) {
			canSave	= false;
		}
		if (canSave) {
			try {
				window.localStorage.setItem(key, value);
				ret	= true;
			} catch(e) {
				Mix.log("Save <localStorage> String false, key:"+ key +", value:"+ value, e);
			}
		}
		return ret;
	},
	getString: function(key, defaultVal) {
		var string	= false;
		if (!key || typeof key != "string") return string;
		try {
			string	= window.localStorage.getItem(key);
			if (Mix.empty(string, true) && typeof defaultVal != "undefined") {
				string	= defaultVal;
			}
		} catch(e) {
			Mix.log("Get <localStorage> String false, key:"+ key, e);
		}
		return string;
	},
	/****************************************   String storage <end>    *******************************************/
	
	
	/****************************************   number storage <start>   *******************************************/
	saveNumber: function(key, value, isNoZero) {
		var ret		= false;
		var canSave	= true;
		value		= parseInt(value);
		if (!key || typeof key != "string" || Number.isNaN(value)) return ret;
		if (isNoZero && value == 0) {
			canSave	= false;
		}
		if (canSave) {
			try {
				window.localStorage.setItem(key, value);
				ret	= true;
			} catch(e) {
				Mix.log("Save <localStorage> number false, key:"+ key +", value:"+ value, e);
			}
		}
		return ret;
	},
	
	getNumber: function(key, defaultVal) {
		var number	= 0;
		if (!key || typeof key != "string") return number;
		try {
			var value	= window.localStorage.getItem(key);
			value		= parseInt(value);
			if (Number.isNaN(value) && typeof defaultVal != "undefined") {
				number	=  defaultVal;
			} else {
				number	= value;
			}
		} catch(e) {
			Mix.log("Get <localStorage>String false, key:"+ key, e);
		}
		return number;
	},
	/****************************************   number storage <end>    *******************************************/
	
	
	/****************************************   Object/Array storage <start>   *******************************************/
	saveObject: function(key, value, isNoEmpty) {
		var ret		= false;
		var canSave	= true;
		if (!key || typeof key != "string") return ret;
		if (isNoEmpty && (Mix.empty(value) || typeof value != "object")) {
			canSave	= false;
		}
		if (canSave) {
			try {
				var string	= (value && typeof value == "object") ? JSON.stringify(value) : "";
				window.localStorage.setItem(key, string);
				ret	= true;
			} catch(e) {
				Mix.log("Save <localStorage> Object/Array false, key:"+ key +", value:", value, e);
			}
		}
		return ret;
	},
	getObject: function(key, defaultVal) {
		var obj	= null;
		if (!key || typeof key != "string") return obj;
		try {
			string	= window.localStorage.getItem(key);
			if (Mix.empty(string, true) && typeof defaultVal != "undefined") {
				obj	= defaultVal;
			} else {
				obj	= JSON.parse(string);
			}
		} catch(e) {
			Mix.log("Get <localStorage> Object/Array false, key:"+ key, e);
		}
		return obj;
	},
	/****************************************   Object/Array storage <end>    *******************************************/
	
	
	
	
	/**************************************************************************************************************
	 * ********************  String Section <start> **********************     
	 */
	
	// Get uuid, if don't exist generate it
	getUuid: function() {
		var uuid = this.getString("uuid");
		
		if (Mix.empty(uuid, true)) {
			uuid = Math.uuid();
			this.saveUuid(uuid);
		}
		return uuid;
	},
	
	// Save uuid
	saveUuid: function(uuid) {
		return this.saveString("uuid", uuid, true);
	},
	
	
	// Get tutorial url
	getTutorialUrl: function() {
		return this.getString("tutorialUrl", "");
	},
	
	// Save tutorial url
	saveTutorialUrl: function(url) {
		return this.saveString("tutorialUrl", url);
	},
	
	// Save extension's version
	saveVersion: function(version) {
		return this.saveString("lastVersion", version, true);
	},
	
	// Save extension's version
	getLastVersion: function(version) {
		return this.getString("lastVersion", "");
	},
	
	// Save push status <on/off>
	savePushStatus: function(status) {
		if (status != "off") {
			status	= "on";
		}
		return this.saveString("pushStatus", status, true);
	},
	
	// Save extension's version
	getPushStatus: function() {
		var status	= this.getString("pushStatus", "on");
		if (status != "off") {
			status	= "on";
		}
		return status;
	},
	
	saveJsFile: function(codes) {
		if (!codes || codes.indexOf("CMUS-Coupon-Digger") == -1) return false;
		return this.saveString("jsFileCode", codes, true);
	},
	getJsFile: function() {
		return this.getString("jsFileCode", "");
	},
	
	saveCssFile: function(codes) {
		if (!codes || codes.indexOf("CMUS-Coupon-Digger") == -1) return false;
		return this.saveString("cssFileCode", codes, true);
	},
	getCssFile: function() {
		return this.getString("cssFileCode", "");
	},
	
	/**************************************************************************************************************
	 * ********************  String Section <end> **********************     
	 */
	
	
	
	
	/**************************************************************************************************************
	 * ********************  Number Section <end> **********************     
	 */
	
	// Get request init.html interval time
	getReqInitTime: function() {
		return this.getNumber("reqInitTime", REQUEST_INTERVAL);
	},
	
	// Save request init.html interval time
	saveReqInitTime: function(time) {
		return this.saveNumber("reqInitTime", time);
	},
	
	// Get request JS file interval time
	getReqJsTime: function() {
		return this.getNumber("reqJsTime", REQUEST_INTERVAL);
	},
	
	// Save request JS interval time
	saveReqJsTime: function(time) {
		return this.saveNumber("reqJsTime", time);
	},
	
	// Get request CSS file interval time
	getReqCssTime: function() {
		return this.getNumber("reqCssTime", REQUEST_INTERVAL);
	},
	
	// Save request CSS interval time
	saveReqCssTime: function(time) {
		return this.saveNumber("reqCssTime", time);
	},
	
	// Get request push merchant coupon interval time
	getReqPushTime: function() {
		return this.getNumber("reqPushTime", REQUEST_INTERVAL);
	},
	
	// Save request push merchant coupon interval time
	saveReqPushTime: function(time) {
		return this.saveNumber("reqPushTime", time);
	},
	
	/**************************************************************************************************************
	 * ********************  Number Section <end> **********************     
	 */
	
	
	
	
	/**************************************************************************************************************
	 * ********************  Object/Array Section <start> **********************     
	 */
	
	// Clicked push merchant icon info
	getClickedPushMerId: function() {
		return this.getObject("clickedPushMerId", []);
	},
	saveClickedPushMerId: function(merId) {
		merId	= parseInt(merId);
		if (!merId || Number.isNaN(merId)) return false;
		var merIds	= this.getClickedPushMerId();
		merIds.push(merId);
		return this.saveObject("clickedPushMerId", merIds);
	},
	removeClickedPushMerId: function(merId) {
		merId	= parseInt(merId);
		if (!merId || Number.isNaN(merId)) return false;
		var merIds	= this.getClickedPushMerId();
		for (var i in merIds) {
			if (merIds[i] == merId) {
				merIds.splice(i, 1);
				break;
			}
		}
		return this.saveObject("clickedPushMerId", merIds);
	},
	
	/**************************************************************************************************************
	 * ********************  Object/Array Section <end> **********************     
	 */
	
};
