/**
 * Only to check plugin file is inject to visiting page
 */

document.addEventListener('DOMContentLoaded', function(){
	window.setTimeout(function(){
		if (!IS_INJECT_CONTENT_PAGE) {
			Mix.log("Not inject context js file, reloading it...");
			chrome.extension.sendRequest({reqType: "reloadCoupon"});
		}
	}, 1000);
});
