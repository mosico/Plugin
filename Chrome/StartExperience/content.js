chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("listen message: ", request);
	switch (request.reqType) {
		case 'getUrl':
			var url	= Context.getUrl();
			sendResponse({retType:"url", content: url});
			break;
		case 'getTitle':
			var title = Context.getTitle();
			sendResponse({retType:"title", content: title});
			break;
		case 'setKeyword':
			Context.setKeyword();
			break;
		case 'doSearch':
			Context.doSearch();
			break;
		default:
			break;
	}
});


var Context = {
	getTitle: function() {
		return document.title;
	},
	getUrl: function() {
		return document.location.href;
	},
	setKeyword: function() {
		var url	= document.location.href;
		var id	= '';
		if (url.indexOf("www.google.com") > 0) {
			id	= 'gbqfq';
		} else if (url.indexOf("www.baidu.com") > 0) {
			id	= 'kw';
		} else {
			return;
		}
		var input	= document.getElementById(id);
		if (!input) return;
		input.value	= "chrome extension development";
	},
	doSearch: function() {
		var url	= document.location.href;
		if (url.indexOf("www.baidu.com") < 0) {
			return;
		}
		var btn	= document.getElementById('su');
		console.log('Submit button:', btn);
		if (!btn) return;
		btn.click();
	}
};