var notiShowTime	= localStorage.getItem("notifyShowTime");
var startTime		= getCurTime();
var timeoutHandle	= null;

function showNotify()
{
	var body	= localStorage.getItem("lastPushCoupon");
	if (body && body.length > 0 && body != "undefined") {		
		document.body.innerHTML = body;
	} else {
		// Non has push coupon, close window after 0.2s
		setTimeout(closeIt, 200);
	}
}

function closeIt() {
	window.close();
}

function getCurTime() {
	var d = new Date();
	var t = d.getTime();
	return t;
}

document.addEventListener('DOMContentLoaded', function(){
	// Append coupon to notify page
	showNotify();
	
	// Auto close popup window after 15s
	timeoutHandle	= setTimeout(closeIt, notiShowTime);
	$(".alert").mouseenter(function(){
		var curTime		= getCurTime();
		notiShowTime	= notiShowTime - (curTime - startTime);
		// On nouse enter prevent window close
		clearTimeout(timeoutHandle);
		clog("11 mouseenter", notiShowTime);
	}).mouseleave(function(){
		startTime	= getCurTime();
		// On nouse leave auto close window after 15s
		timeoutHandle	= setTimeout(closeIt, notiShowTime);
		clog("22 mouseleave");
	});
	
	// FB login
	$("#fbLogin").click(chrome.extension.getBackgroundPage().facebook.login)
	.mouseenter(function(){
		var curTime		= getCurTime();
		notiShowTime	= notiShowTime - (curTime - startTime);
		// On nouse enter prevent window close
		clearTimeout(timeoutHandle);
		clog("11 mouseenter", notiShowTime);
	}).mouseleave(function(){
		startTime	= getCurTime();
		// On nouse leave auto close window after 15s
		timeoutHandle	= setTimeout(closeIt, notiShowTime);
		clog("22 mouseleave");
	});
});




