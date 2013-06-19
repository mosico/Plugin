<?php
$fileList	= array(
		'../json2.js',
		'../messenger.js',
		'./const.js',
		'./mix.js',
		'./ie.js',
		'./default_v3.1.js',	/* js/default/chrome/default_v3.1.js */
);
$outPutFile	= "../coupon_digger.js";


$contents	= "";
$fileCount	= count($fileList);
for ($i = 0; $i < $fileCount; ++$i) {
	echo "Compless File : $fileList[$i] <br>\n";
	$contents	.= minFile($fileList[$i]) ."\n\n\n";
}

// Replace jQuery/$ to jQueryVCB
$contents	= str_replace('$(', 'jQueryVCB(', $contents);
$contents	= str_replace('jQuery(', 'jQueryVCB(', $contents);
$contents	= str_replace('$.', 'jQueryVCB.', $contents);
$contents	= str_replace('jQuery.', 'jQueryVCB.', $contents);
$contents	= str_replace('typeof jQuery', 'typeof jQueryVCB', $contents);

// echo htmlentities($contents);
file_put_contents($outPutFile, $contents);
echo "Conbine files complete. <br>\n";
echo "Output file: $outPutFile <br>\n";


function minFile($fileName) {
	$content	= "";
	if (!file_exists($fileName)) return $content;
	$content	= file_get_contents($fileName);
	
	/* // convert $( to jQuery( , because some site rewrite $ , such as: ice.com
	if (strpos($fileName, 'default_v3.1.js') > 0) {
		$content	= str_replace('$(', 'jQueryVCB(', $content);
		$content	= str_replace('jQuery(', 'jQueryVCB(', $content);
		$content	= str_replace('$.', 'jQueryVCB.', $content);
		$content	= str_replace('jQuery.', 'jQueryVCB.', $content);
		$content	= str_replace('typeof jQuery', 'typeof jQueryVCB', $content);
	}  */
	
// 	// trim /* */
// 	$content	= preg_replace('/\/\*.*\*\//sU', '', $content);
// 	// trim //
// 	$content	= preg_replace('/^\s*\/\/.*\r?\n/sU', '', $content);								// ^//
// 	$content	= preg_replace('/\r?\n(\s*\/\/.*\r?\n)+/sU', '', $content);							// (// \n)+
// 	$content	= preg_replace('/\r?\n\s*\/\/.*\r?\n(?:\s*\/\/.*\r?\n)*/sU', '', $content);			// \n //
// 	$content	= preg_replace('/(\;|\{|\})\s*\/\/.*\r?\n/sU', '$1', $content);						// ;|{|} //
// 	// trim empty string
// 	$content	= preg_replace('/\s+/s', ' ', $content);
	return $content;
}