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
var RET_POPUP_WINDOW = -22;		// Visiting page is popup window
var RET_SNOOZE_COUPON = -30;	// Use coupon snooze

// Apply code time
var APPLY_MAX_TIME	= 300;
var APPLY_MIN_TIME	= 100;
var APPLY_CODE_TIME	= 6;
var APPLY_PAUSE_STATUS	= 0;
var APPLY_BREAK_TIME	= 20000;

//User current view page url type
var PT_NORMAL_PAGE	= 0;
var PT_DETAIL_PAGE	= 1;
var PT_CART_PAGE	= 2;
var PT_FLOW_PAGE	= 3;
var PT_SEARCH_ENGINE_PAGE	= 33;	// Search engine page
var PT_SEARCH_APPEND_COUPON = 34;	// Append coupon to search item after title
var PT_SEARCH_APPEND_MERNUM	= 35;	// Append keyword refer merchant coupon count to search result
var PT_FILL_CODE	= 100;			// Fill code to input box page
var PT_PUSH_MERCHANT_COUPON	= 123;
var PT_EMBED_COUPON	= 125;			// Embed coupon info to current page
var PT_UPDATE_PUSH	= 126;			// Update push merchant coupon number <new coupon's count>

// Match merchant coupon type
var MT_ON_LINE = 0;
var MT_OFF_LINE = 1;

// Verify code type
var	VERIFY_TYPE_REFLASH	= 'REFLASH';
var	VERIFY_TYPE_AJAX	= 'AJAX';

// Plugin get coupon request server file url
var REQUEST_COUPON_URL	= "http://www.couponmountain.com/plugin/getCoupon.html";
// Request plugin initial const such as: interval request time
var REQUEST_INIT_URL	= "http://www.couponmountain.com/plugin/init.html";
// Content page JS file
var REQUEST_JS_URL		= "http://files.couponmountain.com/js/default/chrome/default_v3.1.js";
// Plugin showing CSS file
var REQUEST_CSS_URL		= "http://files.couponmountain.com/css/default/chrome/default_v3.1.css";
// Log use info
var LOG_USE_INFO_URL	= "http://www.couponmountain.com/plugin/adduseinfo.html";


//REQUEST_COUPON_URL	= "http://mamsweb101.dev.wl.mezimedia.com:8081/Coupon/getCoupon.html";
REQUEST_JS_URL		= "http://dev5.couponmountain.com/js/default/chrome/default_v3.1.js";
//REQUEST_CSS_URL		= "http://dev5.couponmountain.com/css/default/chrome/default_v3.1.css";
//LOG_USE_INFO_URL	= "http://mamsweb101.dev.wl.mezimedia.com:8081/Coupon/adduseinfo.html";


// Get xpath as soon as possble, Try param
var XPATH_TRY_TIMES		= 20;
var XPATH_TRY_INTERVAL	= 200;		// Try interval time <micro second>
var XPATH_CLOSE_TIME	= 20000;	// Close connect time <20s>
//Xpath get element status
var XPATH_DEFAULT		= -1;
var XPATH_SUCCESS		= 0;
var XPATH_DOM_LOADING	= 1;
var XPATH_DOM_COMPLETE	= 2;
var	XPATH_ERROR			= 3;


// Submit count coupon click interval
var REQUEST_INTERVAL	= 60000;

// Request URL timeout
var REQUEST_TIMEOUT = 60000;

// Is injected js/css to content page
var IS_INJECT_CONTENT_PAGE = false;

var _gaq = _gaq || [];