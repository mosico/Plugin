var isDelay		= false;
var isDisappear	= true;
var popWidth	= $("#cmusPush").width();
$("#cmusPush").width(popWidth);
$("#cmusPush .popBtn span").click(function(){
	isDisappear	= false;
	var type	= $(this).attr("val");
	if (type === "min") {
		$("#cmusPush .popContent").slideUp(2000);
	} else if (type === "max") {
		$("#cmusPush .popContent").slideDown(2000);
	} else if (type === "close") {
		$("#cmusPush").slideUp(2000);
	}
});

$("#cmusPush").delay(200).slideDown(3000).mouseenter(function(){
	isDelay	= true;
}).mouseleave(function(){
	isDelay	= false;
	autoDisappear(5000);
});

function autoDisappear(time) {
	setTimeout(function(){
		if (isDisappear && !isDelay) {
			$("#cmusPush").slideUp(2000);
		}
	}, time);
}

autoDisappear(8000);