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
var PT_EMBED_COUPON	= 125;			// Embed coupon info to current page
var PT_UPDATE_PUSH	= 126;			// Update push merchant coupon number <new coupon's count>

// Match merchant coupon type
var MT_ON_LINE = 0;
var MT_OFF_LINE = 1;

// Verify code type
var	VERIFY_TYPE_REFLASH	= 1;
var	VERIFY_TYPE_AJAX	= 2;

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
// Push new/favoriter coupon(s) everyday 
var REQUEST_PUSH_URL = "http://www.couponmountain.com/plugin/push.html";
// Send error xpath to service
var SEND_ERROR_XPATH = "http://www.couponmountain.com/plugin/error.html";
// Add merchant to favorite
var ADD_MERCHANT_TO_FAVORITE = "http://www.couponmountain.com/plugin/addFavorite.html";
// Remove a merchant from favorite list
var REMOVE_FAVORITE_MERCHANT = "http://www.couponmountain.com/plugin/removeFavorite.html";
// Show user's all favorite merchants
var SHOW_FAVORITE_MERCHANT = "http://www.couponmountain.com/plugin/showFavorite.html";
// Snooze merchant coupon push
var SNOOZE_FAVORITE_URL = "http://www.couponmountain.com/plugin/snooze.html";
// Push click 
var PUSH_CLICK_URL = "http://www.couponmountain.com/plugin/pushClick.html";
// Online match product page's coupon
var MATCH_DETAIL_PAGE_COUPON_URL = "http://www.couponmountain.com/plugin/match.html";
// Request plugin initial const such as: interval request time
var REQUEST_INIT_URL = "http://www.couponmountain.com/plugin/init.html";
// Content page JS file
var REQUEST_JS_URL = "http://files.couponmountain.com/js/default/chrome/default.js";
// Plugin showing CSS file
var REQUEST_CSS_URL = "http://files.couponmountain.com/css/default/chrome/default.css";


//REQUEST_COUPON_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/getCoupon.html";
//REQUEST_SE_ITEM_COUPON_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/searchEngine.html";
//REQUEST_PRODUCT_COUPON_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/getCouponByProdName.html";
//REQUEST_PUSH_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/push.html";
//SEND_ERROR_XPATH = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/error.html";
//ADD_MERCHANT_TO_FAVORITE = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/addFavorite.html";
//REMOVE_FAVORITE_MERCHANT = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/removeFavorite.html";
//SHOW_FAVORITE_MERCHANT = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/showFavorite.html";
//SNOOZE_FAVORITE_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/snooze.html";
//PUSH_CLICK_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/pushClick.html";
//MATCH_DETAIL_PAGE_COUPON_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/match.html";
//REQUEST_INIT_URL = "http://mamsweb101.dev.wl.mezimedia.com:8088/Coupon/init.html";
REQUEST_JS_URL = "http://dev5.couponmountain.com/js/default/chrome/default.js";
REQUEST_CSS_URL = "http://dev5.couponmountain.com/css/default/chrome/default.css";


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

