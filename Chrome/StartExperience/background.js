//chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {});
//chrome.tabs.sendRequest(Data.tabId, Data, function(response) {});

//chrome.extension.onMessage.addListener(function(Request, sender, sendResponse) {});
//chrome.tabs.sendMessage(Data.tabId, Data, function(response) {});

/*
chrome.tabs.getSelected(null, function(tab) {
	chrome.tabs.sendMessage(tab.id, {greeting: "hello"}, function(response) {
		console.log(response.farewell);
	});
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
	if (request.greeting == "hello")
		sendResponse({farewell: "goodbye"});
});

chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
	console.log(response.farewell);
});
*/