var $i = function(id) {
	return document.getElementById(id);
};
var $s = function(selector) {
	return document.querySelector(selector);
};
var $sa = function(selector) {
	return document.querySelectorAll(selector);
};


var Badge = {
	hide: function() {
		chrome.browserAction.setBadgeText({"text": ''});
	},
	
	text: function(num) {
		// Convert number type to string type
		if (typeof num === "number") {
			num = String(num);
		}
		chrome.browserAction.setBadgeText({"text": num});
	},
	
	bgColor: function(color) {
		chrome.browserAction.setBadgeBackgroundColor({"color": color});
	},
	
	setIcon: function() {
		var iconPath	= "images/" + this.name + ".png";
		chrome.browserAction.setIcon({path: iconPath});
	},
	
	show2: function() {
		Badge.text(2);
	},
	
	show5: function() {
		Badge.text(5);
	},
	
	showNew: function() {
		Badge.text("new");
	},
	
	showRed: function() {
		Badge.bgColor('#F00');
	},
	
	showBlack: function() {
		Badge.bgColor('#000');
	},
};


var Animate = {
	bgColor: function(color) {
		chrome.tabs.executeScript(null, {code: "document.body.style.backgroundColor='" + color + "'"});
	},
	
	showUrl: function(url) {
		var div	= $i('urlText');
		div.innerText		= url;
		div.style.display	= 'block';
	},
	
	showTitle: function(title) {
		var div	= $i('titleText');
		div.innerText		= title;
		div.style.display	= 'block';
	},
};


var Message = {
	send: function(msg) {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendMessage(tab.id, msg, function(response) {
				console.log("send message, response: ", response);
				switch (response.retType) {
					case 'url':
						Animate.showUrl(response.content);
						break;
					case 'title':
						Animate.showTitle(response.content);
						break;
					default:
						break;
				}
			});
		});
	},
	
	listen: function() {
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			console.log("listen message: ", request);
		});
	}
};


var Notification = {
	show: function() {
		var notification = webkitNotifications.createNotification(
			'images/48.png',
			'Hello!',
			'Chrome extension desktop notification'
		);
		notification.show();
	},
	showHtml: function() {
		var notification = webkitNotifications.createHTMLNotification('notification.html');
		notification.show();
	},
	create: function() {
//		var opt = {
//		  type: "list",
//		  title: "Primary Title",
//		  message: "Primary message to display",
//		  iconUrl: "images/16.png",
//		  items: [{ title: "Item1", message: "This is item 1."},
//		          { title: "Item2", message: "This is item 2."},
//		          { title: "Item3", message: "This is item 3."}]
//		};
		var opt = {
		  type: "basic",
		  title: "Primary Title",
		  message: "Primary message to display",
		  iconUrl: "images/16.png"
		};
		chrome.notifications.create("myselfNotification", opt, function(){
			console.log("Create notification completed.");
		});
	}
};


function iconAction() {
	var imgs	= $sa('.icons img');
	for (var i = 0; i < imgs.length; i++) {
		imgs[i].addEventListener('click', Badge.setIcon);
	}
}

function badgeAction() {
	$i('showBadge2').addEventListener('click', Badge.show2);
	$i('showBadge5').addEventListener('click', Badge.show5);
	$i('showBadgeNew').addEventListener('click', Badge.showNew);
	$i('hideBadge').addEventListener('click', Badge.hide);
	$s('.badgeBgcolor .red').addEventListener('click', Badge.showRed);
	$s('.badgeBgcolor .black').addEventListener('click', Badge.showBlack);
}

function bgAction() {
	var imgs	= $sa('.bgColor img');
	for (var i = 0; i < imgs.length; i++) {
		imgs[i].addEventListener('click', function(){
			var color	= this.name;
			console.log("color:", color);
			Animate.bgColor(color);
		});
	}
}

function notifyAction() {
	$i('showNotify').addEventListener('click', Notification.show);
	$i('showHtmlNotify').addEventListener('click', Notification.showHtml);
}

function msgAction() {
	$i('getTitle').addEventListener('click', function(){
		Message.send({reqType:"getTitle"});
	});
	$i('getUrl').addEventListener('click', function(){
		Message.send({reqType:"getUrl"});
	});
	$i('setKw').addEventListener('click', function(){
		Message.send({reqType:"setKeyword"});
	});
	$i('submitKw').addEventListener('click', function(){
		Message.send({reqType:"doSearch"});
	});
}

document.addEventListener('DOMContentLoaded', function () {
	iconAction();
	badgeAction();
	bgAction();
	msgAction();
	notifyAction();
});

