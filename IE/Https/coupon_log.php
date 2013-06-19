<?php
include './coupon_inc.php';


$merUrl		= isset($_POST['url']) ? trim($_POST['url']) : '';
$uuid		= isset($_POST['uuid']) ? trim($_POST['uuid']) : '';
$version	= isset($_POST['version']) ? trim($_POST['version']) : '';
$useinfo	= isset($_POST['useinfo']) ? (array) $_POST['useinfo'] : '';
$tabId		= isset($_POST['tabId']) ? intval($_POST['tabId']) : 0;
$referType	= isset($_POST['referType']) ? intval($_POST['referType']) : 3;


$postData	= array(
	'url'		=> $merUrl,
	'tabId'		=> $tabId,
	'uuid'		=> $uuid,
	'version'	=> $version,
	'referType'	=> $referType,
	'useinfo'	=> json_encode($useinfo)
);


/* ------ If doesn't get merchant url or version or useinfo, exit ------- */
// -------------------------------------------------------------------------------------
if (empty($merUrl) || empty($version) || empty($useinfo)) {
	exit('{"ret":-1,"text":"MerchantURL/Version/Useinfo is empty"}');
} else {	
	$result	= postRequest(TERMINAL_LOG_URL, $postData);
	echo $result;
}

