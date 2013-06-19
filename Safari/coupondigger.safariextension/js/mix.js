var Mix = {
	name: "Mix function class",
	isGetLogStatus: false,
	isLogTestInfo: 0,
	
	// Console.log info
	log: function () {
		if (!Mix.isGetLogStatus) {
			Mix.isLogTestInfo	= Mix.getCookie('isLogTestInfo');
			Mix.isGetLogStatus	= true;
		}
		if (Mix.isLogTestInfo != 1) {
			return ;
		}
		for (var i in arguments) {
			console.log(arguments[i]);
		}
	},
	
	
	// Check string is empty/0/null/undefined, If set isStrict to true it will check string is equal 'undefined'
	empty: function(str, isStrict){
		if (!str) return true;
		if (isStrict && str == "undefined") return true;
		
		var ret	= false;
		if (typeof str == "number") {
			ret	= str > 0 ? false : true;
		} else if (typeof str == "object") {
			var len	= 0;
			for (var key in str) {
				len++;
				break;
			}
			ret	= len > 0 ? false : true;
		} else {
			ret	= str.length > 0 ? false : true;
		}
		return ret;
	},
	
	
	// Copy string to clipboard
	copy: function(text){
		var obj = null, isCopy = false;
		obj	= document.getElementById("copyArea");
		obj.value	= text;
		obj.select();
		isCopy	= document.execCommand("copy", false, null);
		return isCopy;
		
		/*var isCopy = false;
		var copyDiv = document.createElement('div');
	    copyDiv.contentEditable = true;
	    document.body.appendChild(copyDiv);
	    copyDiv.innerHTML = text;
	    copyDiv.unselectable = "off";
	    copyDiv.focus();
	    document.execCommand('SelectAll');
	    isCopy = document.execCommand("Copy", false, null);
	    document.body.removeChild(copyDiv);
	    return isCopy;*/
	},
	
	// Get user current view url's domain
	getUrlDomain: function(url) {
		if (!url) return '';
		
		var matchHost = ((url||'')+'').match(/^http[s]?:\/\/([^\/]+)/);
		var urlHost = matchHost ? matchHost[1] : null;
		
		if(!urlHost) return '';
		
		var curDomain = urlHost;
		for (var i in AllDomainExt) {
			var domainExt = AllDomainExt[i].replace(".", "\\.");
			var RegPatt = new RegExp("([\\w\\-\\_]+)" + domainExt + "$", "i");
			var match = urlHost.match(RegPatt);
			if (match) {
				curDomain = match[0];
				break;
			}
		}
		
		return curDomain;
	},
	
	getVersion: function() {
		var details = chrome.app.getDetails();
		return details.version;
	},
	
	formatErrorXpath: function(errorXpath){
		var errorArr	= [];
		if (errorXpath && errorXpath.length > 0) {
			switch(typeof errorXpath) {
				case "string":
					errorArr.push({"xpath":errorXpath, "id":0});
					break;
				case "object":
					for (var i in errorXpath) {
						switch(typeof errorXpath[i]) {
							case "string":
								errorArr.push({"xpath":errorXpath[i], "id":0});
								break;
							case "object":
								errorArr.push(errorXpath[i]);
								break;
						}
					}
					break;
			}
		}
		return errorArr;
	},
	
	getNum: function(num) {
		var ret	= 0;
		num	= parseInt(num);
		if (!isNaN(num)) {
			ret	= num;
		}
		return ret;
	},
	
	getCookie: function(c_name)
	{
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++)
		{
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x==c_name)
			{
				return unescape(y);
			}
		}
	},
	
	setCookie: function(c_name,value,exdays)
	{
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	}
};

