<?php
noCache();

// Run environment <dev/www>
$runEnv		= 'dev';
// $srvName	= isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : '';
// $srvAddr	= isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : '';
// if ($srvName == 'i.couponmountain.com' && strpos($srvAddr, '127.0.') === false && strpos($srvAddr, '192.168.') === false ) {
// 	$runEnv	= 'www';
// }

switch ($runEnv) {
	case 'www':
		// Get merchant coupon url
		define('COUPON_URL', 'http://www.couponmountain.com/plugin/getCoupon.html');
		
		// Log use info transit url <PHP>
		define('TRANSIT_LOG_URL', 'https://i.couponmountain.com/coupon_log.php');
		
		// Log use info terminal url <JAVA>
		define('TERMINAL_LOG_URL', 'http://www.couponmountain.com/plugin/adduseinfo.html');
		
		// JS urls
		define('JSON_URL', 'https://i.couponmountain.com/json2.js');
		define('JQUERY_URL', 'https://i.couponmountain.com/jquery-1.9.1.min.js');
		define('MESSAGE_URL', 'https://i.couponmountain.com/messenger.js');
		break;
	default:
// 		define('COUPON_URL', 'http://mamsweb101.dev.wl.mezimedia.com:8081/Coupon/getCoupon.html');	// Get merchant coupon url <DEV>
		define('COUPON_URL', 'http://www.couponmountain.com/plugin/getCoupon.html');	// Get merchant coupon url <WWW>
		define('TRANSIT_LOG_URL', 'http://myweb.com/plugin/ie/coupon_log.php');			// Log use info transit url <PHP>
		define('TERMINAL_LOG_URL', 'http://myweb.com/plugin/ie/log-2.php');			// Log use info terminal url <JAVA>
		// JS urls
		define('JSON_URL', 'https://myplugin.com/ie/json2.js');
		define('JQUERY_URL', 'https://myplugin.com/ie/jquery-1.9.1.min.js');
		define('MESSAGE_URL', 'https://myplugin.com/ie/messenger.js');
		break;
}


function postRequest($url, $data)
{
	$ch	= curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	return curl_exec($ch);
}

function noCache()
{
	if(headers_sent()) return FALSE;

	header('pragma: public'); // HTTP/1.0
	header('expires: Mon, 26 Jul 1997 05:00:00 GMT');
	@header('last-modified: ' . gmdate('D, d M Y H:i:s') . ' gmt'); // !
	@header('cache-control: no-store, no-cache, must-revalidate'); // HTTP/1.1
	header('cache-control: private, post-check=0, pre-check=0, max-age=0', FALSE); // HTTP/1.1
	header('pragma: no-cache'); // HTTP/1.0
	header('expires: 0');
	return;
}