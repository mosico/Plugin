// Extension version
var curVer	= Storage.getLastVersion();
$("#version").text(curVer);

// interval time
var intTime	= Storage.getCodeTime();
if (!intTime) intTime	= 0;
$('#intervalTime').val(intTime);

// max execute time
var maxTime	= Storage.getMaxExecTime();
if (maxTime && maxTime < APPLY_MIN_TIME) maxTime	= APPLY_MIN_TIME;
if (!maxTime) maxTime	= APPLY_MAX_TIME;
$('#maxExecTime').val(maxTime);

// pause status
var pauseVal	= Storage.getPauseSwitch();
if (pauseVal == 1) {
	$('#pauseSwitch').attr('class', 'selected');
}
$('#pauseSwitch').click(function(){
	var pau	= $(this);
	var cls	= pau.attr("class");
	if (cls == 'selected') {
		pau.attr("class", 'unselected');
	} else {
		pau.attr("class", 'selected');
	}
});

function getNum(num) {
	num	= parseInt(num);
	num	= Number.isNaN(num) || num < 0 ? 0 : num;
	return num;
}



// save options value
$("#saveOptions").click(function() {
	$("#saveMsg").clearQueue().stop();
	var codeTime	= getNum($("#intervalTime").val());
	var maxTime		= getNum($("#maxExecTime").val());
	var pauseVal	= $("#pauseSwitch").attr("class") == 'selected' ? 1 : 0;
	maxTime	= maxTime < APPLY_MIN_TIME ? APPLY_MAX_TIME : maxTime;
	$("#intervalTime").val(codeTime);
	$("#maxExecTime").val(maxTime);
	Storage.saveCodeTime(codeTime);
	Storage.saveMaxExecTime(maxTime);
	Storage.savePauseSwitch(pauseVal);
	// show msg
	$("#saveMsg").fadeIn(200).delay(3000).fadeOut(2000);
});