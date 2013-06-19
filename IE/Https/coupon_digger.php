<?php
include './coupon_inc.php';

$referUrl	= isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$uuid		= isset($_GET['u']) ? $_GET['u'] : '95531B9A-D1C5-4874-A3EE-7819EC33B461';
$version	= isset($_GET['v']) ? $_GET['v'] : '1.0.2013.4283';

$postData	= array(
	'url'	=> $referUrl,
	'tabId' => 0,
	'uuid'	=> $uuid,
	'version'	=> $version,
	'referType'	=> 3,
	'isLog'		=> 0,
	'isSearch'	=> 0,
	'width'		=> 0,
	'height'	=> 0
);


// ------ If doesn't get merchant url, exit -------
if (empty($referUrl)) {
	exit('{"ret":-1,"count":0,"text":"ReferUrl(merchantUrl) is empty"');
}


$couponInfo	= postRequest(COUPON_URL, $postData);
?>

<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Coupon Digger</title>
<script type="text/javascript" src="<?php echo JSON_URL;?>"></script>
<script type="text/javascript" src="<?php echo JQUERY_URL;?>"></script>
<script type="text/javascript" src="<?php echo MESSAGE_URL;?>"></script>
<script type="text/javascript">
var CM_LOG_URL		= "<?php echo TRANSIT_LOG_URL;?>";
var CM_COUPON_INFO	= <?php echo $couponInfo ? $couponInfo : '{ret:-1, count:0}';?>;
var CM_VERSION		= "<?php echo $version;?>";
var CM_URL			= "<?php echo $referUrl?>";
var CM_UUID			= "<?php echo $uuid;?>";
</script>
</head>
<body>

<div>
	<pre id="output"></pre>
</div>

<script type="text/javascript">
var isSendCouponInfo	= false;
var isGetingCode		= false;
var getCodeTimes		= 0;
var messenger			= Messenger.initInIframe();
messenger.onmessage = function (data) {
	cmus_outputText(data);
	
	var D	= null;
	if (data && typeof data === "string" && data.length > 0) {
		try {
			D	= JSON.parse(data);
			if (!D.type) return;
		} catch (e) {
			cmus_outputText("Parse JSON DATA ERROR:====");
			cmus_outputText(e);
			return;
		}

		switch (D.type) {
			case "getCoupon":
				cmus_sendCouponInfo();
				break;
			case "logUseInfo":
				cmus_logUseInfo(D);
				break;
			default:
				break;
		}
	}
};

function cmus_outputText(data) {
	var newline	= '\n';
	var text		= document.createTextNode(data + newline);
	document.getElementById('output').appendChild(text);
}

function cmus_sendMsg(msg) {
	messenger.send(msg);
}

function cmus_sendCouponInfo() {
	if (isSendCouponInfo || getCodeTimes > 5) {
		cmus_outputText("--- Send Coupon Info Failure !!!!!");
		return;
	}
	isSendCouponInfo	= true;
	getCodeTimes++;
	CM_COUPON_INFO.msgType	= "couponInfo";
	cmus_sendMsg(JSON.stringify(CM_COUPON_INFO));
	isGetingCode	= false;
}

function cmus_logUseInfo(data) {
	var param	= {
		'url': CM_URL,
		'tabId': 0,
		'uuid': CM_UUID,
		'version': CM_VERSION,
		'referType': 3,
		'useinfo': data
	};
	cmus_outputText("log data: "+ JSON.stringify(param));
	var JQ	= typeof jQuery == "object" ? jQuery : jQueryVCB;
	JQ.ajax({
    	"url": CM_LOG_URL,
    	"type": "POST",
    	"data": param,
		"dataType": "json",
		"timeout": 30000,
		"cache": false,
		"success": function(Data) {
			cmus_outputText(JSON.stringify(Data));
		},
		"complete": function(jqXHR, status) {
			cmus_outputText("log completed, status: "+ status);
		}
	});
}
</script>

</body>
</html>
