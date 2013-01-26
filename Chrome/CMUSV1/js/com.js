// Comment js or define global variable

// Ajax request return Code
var RET_SUCCESS = 0;
var RET_URL_ERROR = -11;
var RET_MERCHANT_ERROR = -12;
var RET_PRODUCT_NAME_ERROR = -13;
var RET_SE_URL_ERROR = -15;
var RET_CHECKED_CODE_ERROR = -16;
var RET_OTHER = -1;
var RET_UUID_ERROR = -18;
var RET_ADD_ALERT_ERROR = -19;
var RET_UUID_NO_ALERT = -20;

// User current view page url type
var PT_NORMAL_PAGE	= 0;
var PT_DETAIL_PAGE	= 1;
var PT_CART_PAGE	= 2;
var PT_FLOW_PAGE	= 3;
var PT_SEARCH_ENGINE_PAGE	= 33;	// Search engine page
var PT_SEARCH_APPEND_COUPON = 34;	// Append coupon to search item after title
var PT_SEARCH_APPEND_MERNUM	= 35;	// Append keyword refer merchant coupon count to search result
var PT_FILL_CODE	= 100;			// Fill code to input box page
var PT_PUSH_MERCHANT_COUPON	= 123;

//Match merchant coupon type
var MT_ON_LINE = 0;
var MT_OFF_LINE = 1;

//Alert type
var ALERT_ADD_MERCHANT = 1;    // Add new merchant coupon alert
var ALERT_GET_UPDATED = 2;     // Get uuid refer merchant updated coupon
var ALERT_CANCEL_NOTIFY = 3;   // Tuen off merchant coupon notification
var ALERT_GET_DOMAINS = 4;     // Get uuid refer's all turn on merchant domains

// Product name match rate
var MATCH_NAME_RATE = 0.8;

// Plugin get coupon request server file url
var REQUEST_COUPON_URL = "http://www.couponmountain.com/plugin/getCoupon.html";
// Get search engine item urls are coupon, request server url
var REQUEST_SE_ITEM_COUPON_URL = "http://www.couponmountain.com/plugin/searchEngine.html";
// Off line match product coupon url
var REQUEST_PRODUCT_COUPON_URL = "http://www.couponmountain.com/plugin/getCouponByProdName.html";
// Check coupon code is expire url
var REQUEST_CHECK_COUPON_URL = "http://www.couponmountain.com/plugin/expire.html";
// Add new uuid, Get merchant alert coupon 
var REQUEST_ALERT_URL = "http://www.couponmountain.com/plugin/alert.html";
// Push new/favoriter coupon(s) everyday 
var REQUEST_PUSH_URL = "http://www.couponmountain.com/plugin/pushOne.html";
// Send error xpath to service
var SEND_ERROR_XPATH = "http://www.couponmountain.com/plugin/error.html";
// Submit coupon click count to service
var SUBMIT_COUNT_XPATH = "http://www.couponmountain.com/plugin/click.html";
// Submit facebook user base info to service
var SUBMIT_FB_INFO_XPATH = "http://www.couponmountain.com/plugin/saveFb.html";
// Get 'tutorial url' and 'recent alert url'
var GET_URLS = "http://www.couponmountain.com/plugin/urls.html";

//request max time
var REQUEST_POLLING_TIMEOUT = 1800000;
// request one data max time
var REQUEST_TIMEOUT = 600000;

//How long request alert coupon
var REQUEST_ALERT_INTERVAL = 30000;

// Badge background color
var BADGE_BG_COLOR_SITE 	= "#6cd8ff";
var BADGE_BG_COLOR_MATCHED	= "#F00";

// Get xpath as soon as possble, Try param
var XPATH_TRY_TIMES		= 20;
var XPATH_TRY_INTERVAL	= 200;		// Try interval time <micro second>
var XPATH_CLOSE_TIME	= 10000;	// Close connect time <10s>
//Xpath get element status
var XPATH_DEFAULT		= -1;
var XPATH_SUCCESS		= 0;
var XPATH_DOM_LOADING	= 1;
var XPATH_DOM_COMPLETE	= 2;
var	XPATH_ERROR			= 3;

// Push everyday coupons interval
var PUSH_COUPON_INTERVAL	= 30000;

// Submit count coupon click interval
var COUNT_COUPON_INTERVAL	= 60000;

// Icon image file
var ICON_DEFAULT_FILE = chrome.extension.getURL("images/icon.jpg");
var ICON_ALERT_FILE = chrome.extension.getURL("images/alert.jpg");


// Plugin instruction page url
var INSTRUCTION_PAGE_URL	= "http://www.couponmountain.com/plugin/tutorial.html";
// Notification page url
var NOTIFICATION_PAGE_URL	= "http://www.couponmountain.com/plugin/alert/?uid=";


// Popup window per page(max) show coupon number
var PAGE_SHOW_NUM	= 14;


function clog() {
	return null;
	for (var i in arguments) {
		console.log(arguments[i]);
	}
}

