/**
 * Make sure don't remove this block <comment>
 * CMUS-Coupon-Digger content page JS
 */

if (IS_INJECT_CONTENT_PAGE) {
	Mix.log("Aready injected page content......");
} else {
	Mix.log("Is injecting page content......");
	IS_INJECT_CONTENT_PAGE	= true;

var isShowingCoupon	= false;	// Coupon list is showing or not
var isOnCouponList	= false;	// Mouse isn't on coupon list div
var isOnSnoozeDiv	= false;	// Mouse isn't on snooze div
var isShowingSnooze	= false;	// Mouse isn't on snooze div
var curShowCouponType		= 0;		// Current showing coupon list type
var SHOW_MERCHANT_COUPON	= 1;		// Showing current page merchant's coupon
var SHOW_PUSH_COUPON		= 2;		// Showing push/notification merchant coupon
var SHOW_SEARCH_COUPON		= 3;		// Showing search engin page's merchant coupon
var tipsCopyCode		= "Click to Copy";
var tipsCopyCodeSucc	= "Code Copied";
var tipsCopyCodeFail	= "Copy failed";

var Html = {
	getWhole: function(Req) {
		var html = '';
		
		// Merchant coupon list html
		var listHtml		= this.getCouponList(Req.count, Req.merName, Req.coupon, true);
		html += '<div id="cmus2012_couponList">'+ listHtml + '</div>';
		
		// Merchant push new coupons
		var pushHtml	= this.getPush(Req.pushStatus, Req.push);
		
		// If Current page doesn't has coupon, don't show number
		var curIconHtml	= "";
		if (Req.count > 0) {
			var numHtml	= (Req.countPic && Req.countPic.length > 0) ? '<img src="'+ Req.countPic +'" />' : Req.count;
			iconClass	= 'cmus2012_cmIcons';
			countHtml	= '<div class="cmus2012_cm"><div class="cmus2012_number">'+ numHtml +'</div></div>';
			curIconHtml	= '<div class="'+ iconClass +'" id="cmus2012_couponIcon">'+ countHtml +'</div>';
		}
		html += '<div id="cmus2012_iconsList">';
		html += '   <div id="cmus2012_iconStart"></div>';
		html += pushHtml;
		html += curIconHtml;
		html += '<div class="cmus_popup_l_wp"><div class="cmus_popup_l"><div class="cmus_popup_l_border"><div class="cmus_popup_l_content"><div class="cmus_arrow"></div><span id="cmusPushTips">12 new coupon on tartet</span></div></div></div></div>';
		html += '</div>';
		
		
		// Add call coupon iframe 
		html += '<iframe src="" style="display:none" id="cmus2012_callLink"></iframe>';
		
		return html;
	},
	
	// Generate coupon list's html
	getCouponList: function(count, domain, Coupons, isExpand){
		var listHtml	= '';
		var countCoupon	= count > 1 ? count + ' Coupons' : '1 Coupon';
		listHtml += '   <div id="cmus2012_boxList">';
		listHtml += '      <div class="cmus2012_sitelink"><a href="http://www.couponmountain.com/" target="_blank">CouponMountain.com</a></div>';
		listHtml += '      <div class="cmus2012_title"> '+ countCoupon +' for <div class="cmus_merchantname">'+ domain +'</div></div>';
		listHtml += '      <div class="cmus2012_close"></div>';
		listHtml += '      <div class="cmus2012_box">';
		// Recurrents show coupon info
		for (var i in Coupons) {
			listHtml += '          <div class="cmus2012_coupon" attrIndex="'+ i +'">';
			
			if (isExpand && i == 0) {
				listHtml += this.getTitle(Coupons[i], isExpand);
				Context.selectedCoupon	= Coupons[0];
				listHtml += this.getDetail(true);
			} else {
				listHtml += this.getTitle(Coupons[i], false);
			}
			
			listHtml += '          </div>';
		}
		
		listHtml += '          <div class="cl"></div>';          
		listHtml += '      </div>';
		// Search engine page's merchant coupon don't show footer
		if (curShowCouponType != SHOW_SEARCH_COUPON) {
			listHtml += this.getFooter();
		}
//		listHtml += '      <div class="cmus_tipbox" id="cmus_copyTips">Click to Copy</div>';
//		listHtml += '      <div class="cmus_tipbox cmus_tipboxcopied">Code copied</div>';
		listHtml += '      <div class="cmus_popup_b"><div class="cmus_popup_b_content"><div class="cmus_arrow"></div><span id="cmusFollowTips">target not followed</span></div></div>';
		listHtml += '      <div class="cmus2012_couponList_bot"></div>';
		listHtml += '   </div>';
		
		return listHtml;
	},
	
	// Generate coupon list's html
	getPush: function(pushStatus, pushData) {
		var pushHtml	= '';
		if (pushStatus == "on" && pushData && pushData.length > 0) {
			for (var i in pushData) {
				var merNews	= pushData[i];
				var link	= merNews.url ? merNews.url : "javascript:void();";
				pushHtml += '<div class="cmus2012_Icons">';
				pushHtml += ' <div class="cmus2012_other" merId="'+ merNews.merId +'" count="'+ merNews.count +'" merName="'+ merNews.merName +'" tagUrl="'+ link +'">';
				pushHtml += '     <img src="'+ merNews.icon +'" alt="'+ merNews.merName +'" width="16" height="16" />';
				pushHtml += '     <div class="cmus2012_total"><span>'+ merNews.count +' new</span></div>';
				pushHtml += ' </div>';
				pushHtml += ' <div class="cmus2012_closealert"></div>';
				pushHtml += ' <div class="cmus2012_closealertwp"><div class="cmus2012_closealertcontent">';
				pushHtml += ' 	<a href="javascript:void(0);" class="cmusIconForbid">Don\'t follow '+ merNews.merName +'</a>';
				pushHtml += '   <a href="javascript:void(0);" class="cmusIconSnooze">Snooze 24 hours</a>';
				pushHtml += ' </div></div>';
				pushHtml += '</div>';
			}
		}
		return pushHtml;
	},
	
	// Generate coupon title html
	getTitle: function(Coupon, isExpand){
		var extCls	= 'cmus_notnewcoupon';
		var titTips	= '';
		if (Coupon.isMatch) {
			extCls	= 'cmus_hasnewcoupon';
			titTips	= '<div class="cmus_featuredcoupon"></div>';
		} else if (Coupon.isNew) {
			extCls	= 'cmus_hasnewcoupon';
			titTips	= '<div class="cmus_newcoupon"></div>';
		}
		var title	= "";
		if (isExpand) {
			title	= Coupon.title;
			extCls	+= " cmus2012_couponArrowexpanded";
		} else {
			title	= "<span><em>"+ Coupon.title +"</em></span>";
		}
		var titleHtml	= '';
		titleHtml += '             <div class="cmus2012_couponArrow '+ extCls +'">';
		titleHtml += '                <a href="javascript:void(0)" class="cmus2012_couponTitleLk">'+ title +'</a>' + titTips;
		titleHtml += '             </div>';
		return titleHtml;
	},
	
	// generate coupon list footer html
	getFooter: function() {
		var favorite	= Context.reqData.isFavorite;
		var favClass	=  "unfollow";
		if (favorite == 1) {
			favClass	= "followed";
		} else if (favorite == 2) {
			favClass	= "followfull";
		}
		var html	= '';
		html += '<div id="cmus2012_footer">';
		html += '<div id="cmus2012_setting">';
		html += '	<ul>';
		// Only coupon list is current page's merchant coupon show favorite
		if (curShowCouponType == SHOW_MERCHANT_COUPON) {
			html += '    	<li><a href="javascript:void(0);" class="'+ favClass +'" id="cmusFollowOpt">Follow</a></li>';
		}
		html += '    	<li><a href="javascript:void(0);" class="sharetofacebook" target="_parent">Facebook</a></li>';                         
		html += '    </ul>';
		html += '    <div id="cmus2012_settingwrapper">';
		html += '    </div>';
		html += '</div>';
		html += '<div id="cmus_recentAlert"><a href="javascript:void(0);" class="setting">Setting</a></div>';
		html += '</div>';
		return html;
	},
	
	getDetail: function(isShow){
		var curCoupon	= Context.selectedCoupon;
		if (!curCoupon || curCoupon.length < 1) return '';
		var html	= '';
		var link	= '';
		var expDate	= '';
		var style	= '';
		var code	= curCoupon.code;
		var decodeDesc	= $("<div />").html(curCoupon.descript).text();
		if (curCoupon.link && curCoupon.link.length > 0 ) {
			link	= ' <a href="'+ curCoupon.link +'" target="_blank">Go shopping</a>';
		}
		if (curCoupon.expireDays) {
			expDate	= '<div class="cmus_expiredate">'+ curCoupon.expireDays +'</div>';
		}
		if (!isShow) {
			style	= ' style="display:none;"';
		}
		html += '<div id="cmus2012_couponDetailDiv"'+ style +'>';
		html += '    <div class="cmus2012_top"></div>';
		html += '    <div class="cmus2012_mid">';
		if (code && code != "undefined") {
			html += '        <div class="cmus2012_useCode">';
			html += '            <strong>CODE:</strong>  <span class="cmus2012_codeL"><span class="cmus2012_codeR"><span class="cmus2012_codeM">'+ code +'</span></span></span>';
			html += '        </div>';
		}
//		html += '            <div class="cmus_tipbox">Click to Copy</div>';
//		html += '            <div class="cmus_tipbox cmus_tipboxcopied">Click copied</div>';
		html += '        <div class="cmus2012_desc">'+ expDate + decodeDesc + link +'</div>';
		html += '    </div>';
		html += '    <div class="cmus2012_bot"></div>';
		html += '</div>';
		return html;
	},
	
	getSetting: function(FavData){
		var html = "";
		// Plugin status turn on/turn off
		var statusClass = "";
		if (FavData.status == "on") {
			statusClass				= "on";
			Context.isTurnOnPush	= true;
		} else {
			statusClass				= "off";
			Context.isTurnOnPush	= false;
		}
		html += '<div class="cmus_settingheader">';
		html += '<div class="cmus_settingright">';
		html += '    <div class="cmus_closesetting"></div>';
		html += '    <div class="cmus_help"><a href="javascript:void(0);" target="_blank">Help</a></div>';
		html += '</div>';
		html += '<div class="cmus_settingtitle">Settings</div>';
		html += '</div>';
		html += '<div class="cmus_couponalert"><span>New coupon notification :</span> <a href="javascript:void(0);" class="'+ statusClass +'" id="cmusPushOn"></a></div>';
		// Favorite merchants
		if (FavData.count > 0) {
			html += '<div class="cmus_favoritesites">';
			html += '	<div class="headline">Followed merchants :</div>';
			html += '    <ol>';
			for (var i in FavData.favorite) {
				html += '    	<li><a href="javascript:void(0);" class="cmusRemoveMerId" merId="'+ FavData.favorite[i].merId +'">'+ FavData.favorite[i].merName +'</a></li>';
			}
			html += '    </ol>';
			html += '</div>';
		}
		html += '<div class="cmus_version">Version '+ Context.version +'</div>';
		return html;
	},
	
};


var Animate = {
	_iconCloseBtnHd: [],
	_copyTipsTimeHd: null,
	_isShowCopyTips: false,
	isShowSetting: false,
	isTurnOnPush: false,
	curShowSeItem: null,
	hasAddTitleOmit: false,
	
	showCouponList: function(x, y, autoHeight) {
		$list	= $("#cmus2012_couponList");
		if (curShowCouponType == SHOW_SEARCH_COUPON) {
			x	= x > 10 ? x : 400;
			y	= y > 10 ? y : 300;
			$list.removeClass("normal").attr("style", "position: absolute; left:"+ x +"px; top:"+ y +"px;");
		} else {
			$list.attr("style", "").addClass("normal");
		}
		// Set coupon list height to auto
		if (autoHeight) {
			$(".cmus2012_box").attr("style", "height:auto; max-height: 275px;");
		} else {
			$(".cmus2012_box").removeAttr("style");
		}
		
		$list.slideDown();
		Animate.expandAllTitleOmit();
		isShowingCoupon	= true;
	},
	
	hideCouponList: function() {
		$("#cmus2012_couponList").slideUp();
		// Set coupon list status to hiding
		isShowingCoupon	= false;
	},
	
	expandAllTitleOmit: function() {
		if (Animate.hasAddTitleOmit) return false;
		
		$(".cmus2012_couponArrow").each(function(i, e){
			if (i != 0) {
				Animate.addTitleOmit(e);
			}
		});
		
		Animate.hasAddTitleOmit	= true;
	},
	
	// If title is too long add omit
	addTitleOmit: function(titleDiv) {
		var e	= $(titleDiv);
		var showLen	= e.find("span").width();
		var titLen	= e.find("em").width();
		if (titLen > showLen) {
			e.append('<div class="cmus_fixlongtitle">...</div>');
		}
	},
	
	// Remove title's omit
	removeTitleOmit: function(titleDiv) {
		var e	= $(titleDiv);
		e.find(".cmus_fixlongtitle").remove();
	},
	
	// Show current page's coupon in list
	/*showCurPageCoupon: function(){
		if (isShowingCoupon) Animate.hideCouponList();
		
		// Showing visiting page's coupon
		curShowCouponType	= SHOW_MERCHANT_COUPON;
		
		var listHtml	= Html.getCouponList(Context.curCount, Context.reqData.merName, Context.reqData.coupon);
		
		$("#cmus2012_couponList").html(listHtml);
		$(".cmus2012_couponList_bot").hide();
		Animate.showCouponList();
	},*/
	
	expandDetail: function() {
		Animate.closeSetting(true);
		
		var $this	= $(this);
		var $parent	= $this.parent().parent();
		var index	= $parent.attr("attrIndex");
		var curCoupon	= null;
		switch (curShowCouponType) {
			case SHOW_MERCHANT_COUPON:
				curCoupon	= Context.reqData.coupon[index];
				break;
			case SHOW_SEARCH_COUPON:
				curCoupon	= Context.curShowSeItem.coupon[index];
				break;
			default:
				Mix.log("Can't get coupon detail !!");
				return false;
		}
		var title		= curCoupon.title;
		var $thisDetail	= $parent.find("#cmus2012_couponDetailDiv");
		Context.selectedCoupon	= curCoupon;
		
		// If current coupon has expanded, close it
		if ($thisDetail && $thisDetail.length > 0) {
			$thisDetail.slideUp(400, function(){
				$this.html("<span><em>"+ title +"</em></span>").parent().removeClass("cmus2012_couponArrowexpanded");
				Animate.addTitleOmit($this.parent());
				$thisDetail.remove();
			});
		// Close expanded coupon and expand current click coupon
		} else {
			Animate.closeDetail();
			Animate.removeTitleOmit($this.parent());
			var detailHtml	= Html.getDetail();
			// Append and expand current coupon's detail
			$this.parent().addClass("cmus2012_couponArrowexpanded");
			$this.text(title);
			$parent.append(detailHtml);
			$("#cmus2012_couponDetailDiv").slideDown('normal',function(){
                Animate.setPos(index);
            });
		}
	},
	
	closeDetail: function(isSlowly) {
		var $detail		= $("#cmus2012_couponDetailDiv");
		// Has expanded coupon, close it
		if ($detail && $detail.length > 0) {
			// Reset expanded coupon's title
			$expandedDetail	= $detail.parent().find(".cmus2012_couponTitleLk");
			$expandedTitle	= $expandedDetail.text();
			$expandedDetail.html("<span><em>"+ $expandedTitle + "</em></span>");
			// Remove expaned class
			$detail.prev().removeClass("cmus2012_couponArrowexpanded");
			Animate.addTitleOmit($detail.prev());
			
			if (isSlowly) {
				$detail.slideUp(200, function(){
					$detail.remove();
				});
			} else {
				// Remove expanded coupon's detail
				$detail.remove();
			}
		}
	},
	
	setPos: function(index){
        if(index==0) return;
        var nexth=$('.cmus2012_coupon:eq('+(0-(-index-1))+') .cmus2012_couponArrow').height() || 0
            ,viewh = nexth + $('.cmus2012_coupon:eq('+index+')').position().top - $(".cmus2012_box").position().top + $('.cmus2012_coupon:eq('+index+')').height()
            ,cbh=$(".cmus2012_box").height();
        if(viewh>cbh){
             $(".cmus2012_box").animate({scrollTop:$(".cmus2012_box").scrollTop() + viewh - cbh}, 500);
        }
	},
	
	// Mouse over coupon code
	mouseOverCode: function() {
		clearTimeout(Animate._copyTipsTimeHd);
		Animate._copyTipsTimeHd	= null;
		
		var curCoupon		= Context.selectedCoupon;
		var curCopiedCoupon	= Context.curCopiedCoupon;
		
		if (Animate._isShowCopyTips) return;
		
		// Current code is copied
		if (curCoupon && curCopiedCoupon && curCoupon.code == curCopiedCoupon.code) {
			$(this).after('<div class="cmus_tipbox cmus_tipboxcopied">'+ tipsCopyCodeSucc +'</div>');
		} else {
			$(this).after('<div class="cmus_tipbox">'+ tipsCopyCode +'</div>');
		}
		$(".cmus2012_useCode").addClass("cmus2012_useCode_over");

		Animate._isShowCopyTips	= true;
	},
	
	// Mouse over coupon code copy tips 
	mouseOverCodeTips: function() {
		clearTimeout(Animate._copyTipsTimeHd);
		Animate._copyTipsTimeHd	= null;
		Animate._isShowCopyTips	= true;
	},
	
	// Mouse out coupon code
	mouseOutCode: function() {
		Animate._copyTipsTimeHd	= setTimeout(function(){
			$(".cmus2012_useCode").removeClass("cmus2012_useCode_over");
			$(".cmus_tipbox").remove();
			Animate._isShowCopyTips	= false;
		}, 100);
	},
	
	showSetting: function(){
		// Close Favorite tips
		$(".cmus_popup_b").hide();
		// Close expanded coupon detail
		Animate.closeDetail(true);
		
		if (!Animate.isShowSetting) {
			Context.sendRequest({"reqType": "getFavorites"}, function(Res){
				Context.followCount	= Res.count;
				var html = Html.getSetting(Res);
				$("#cmus2012_settingwrapper").html(html);
				
				Animate.isShowSetting	= true;
				$("#cmus2012_setting").find("ul").removeClass("over");
				$(".setting").addClass("settingactive");
				$("#cmus2012_settingwrapper").slideDown();
			});
		} else {
			Animate.closeSetting();
		}
	},
	
	closeSetting: function(isQuick){
		if (Animate.isShowSetting == false) return ;
		
		Animate.isShowSetting	= false;
		$(".setting").removeClass("settingactive");
		if (isQuick) {
			$("#cmus2012_settingwrapper").hide();
		} else {
			$("#cmus2012_settingwrapper").slideUp();
		}
	},
	
	help: function(){
		var cmus_help_tutorial = $('#cmus_help_tutorial');
		if(cmus_help_tutorial.length<1){
			$('body').append('<div id="cmus_help_tutorial"><div class="cmus_help_tutorial_bg"></div><p><span></span></p></div>');
			$('#cmus_help_tutorial').click(function(){
				$(this).css({display:'none'});
			});
		}else{
			cmus_help_tutorial.css({display:cmus_help_tutorial.css('display')=='none'?'block':'none'});
		}
		
		return false;
	},
	
	// When mouse over push merchant icon, show tips
	showIconTips: function(revIndex, count, merName, isCurMer){
		if (!isCurMer) {
			var index			= $(".cmus2012_other").index(this);
			var pushCount		= $(".cmus2012_other").length;
			revIndex	= pushCount - index;
			// If is show cm icon, reverseIndex add 1
			var cmIcon		= $("#cmus2012_couponIcon");
			if (cmIcon && cmIcon.length > 0) {
				revIndex++;
			}
			var $this	= $(this);
			count		= $this.attr("count");
			merName		= $this.attr("merName");
			Animate.showIconCloseBtn($this.parent(), $this.attr("merId"));
		}
		
		revIndex	= parseInt(revIndex);
		count		= parseInt(count);
		if (revIndex == "NaN" || count == "NaN" || !count || !merName || merName == "undefined") {
			return false;
		}
		var tipText	= "";
		if (count == 1) {
			tipText	= isCurMer ? " coupon on " : " new coupon on ";
		} else {
			tipText	= isCurMer ? " coupons on " : " new coupons on ";
		}
		
		var position	= 18 + (revIndex - 1) * 56;
		$("#cmusPushTips").text(count + tipText + merName);
		$(".cmus_popup_l").attr("style", "bottom:"+ position +"px;").show();
	},
	
	// When mouse out push merchant icon, hide tips
	hideIconTips: function(isCurMer){
		$(".cmus_popup_l").hide();
		var $this	= $(this);
		if (isCurMer !== true) {
			Animate.hideIconCloseBtn($this.parent(), $this.attr("merId"));
		}
	},
	
	// Show visiting page's merchant tips
	showCurMerIconTips: function(){
		Animate.showIconTips(1, Context.curCount, Context.reqData.merName, true);
	},
	// Hide visiting page's merchant tips
	hideCurMerIconTips: function(){
		Animate.hideIconTips(true);
	},
	
	// Update push coupon count
	updatePush: function(Req) {
		if (!Req || !Req.data || Req.data.length < 1) {
			return false;
		}
		
		// Find current merchant coupon count
		// If has exist push coupon, update exist count and remove it from pushData
		var curPushs	= $(".cmus2012_other");
		if (curPushs && curPushs.length > 0) {
			curPushs.each(function(i, e){
				var $this = $(e);
				var merId = $this.attr("merId");
				for (var j in Req.data) {
					var pushItem = Req.data[j];
					if (pushItem.merId == merId) {
						$this.attr("count", pushItem.count);
						$this.find(".cmus2012_total span").text(pushItem.count + " new");
						Req.data.splice(j, 1);
						break;
					}
				}
			});
		}
		
		// Has unExpanded push coupon, expand it
		var pushHtml	= Html.getPush("on", Req.data);
		if (pushHtml) {
			$("#cmus2012_iconStart").after(pushHtml);
		}
	},
	
	// Clear exist push merchant icon
	clearPushIcon: function() {
		var Icons	= $(".cmus2012_Icons");
		if (Icons && Icons.length > 0) {
			Icons.each(function(index, ele){
				$(ele).remove();
			});
		}
	},
	
	showIconCloseBtn: function(iconDiv, merId) {
		window.clearTimeout(Animate._iconCloseBtnHd[merId]);
		$(iconDiv).find(".cmus2012_closealert").show();
	},
	hideIconCloseBtn: function(iconDiv, merId) {
		Animate._iconCloseBtnHd[merId]	= window.setTimeout(function(){
			$(iconDiv).find(".cmus2012_closealert").hide();
		}, 100);
	},
	
	showSnoozeOption: function(snoozeDiv) {
		if (isShowingSnooze) {
			Animate.hideSnoozeOption();
		}
		$(snoozeDiv).show();
		isShowingSnooze	= true;
	},
	hideSnoozeOption: function() {
		$(".cmus2012_closealertwp").each(function(i, e){
			$(e).hide();
		});
		isShowingSnooze	= false;
	},
	
};


var Context = {
	reqData: null,
	curCount: 0,
	selectedCoupon: null,
	curCopiedCoupon: null,
	followCount: 0,
	version: "",
	isAddFavorite: false,
	
	sendRequest: function(Data, callback) {
		Data.tabUrl	= Context.reqData.url;
		Data.tabId	= Context.reqData.tabId;
		chrome.extension.sendRequest(Data, function(Res){
			if (typeof callback == "function") {
				callback(Res);
			}
		});
	},
	
	embedCoupon: function(Req) {
		var intHandle	= null;
		var tryTimes	= 0;
		intHandle	= setInterval(function(){
			tryTimes++;
			if (tryTimes > 20) {
				clearInterval(intHandle);
			}
			if (document && document.body) {
				clearInterval(intHandle);
				Context.execEmbed(Req);
			}
		}, 300);
	},
	
	execEmbed: function(Req) {
		this.reqData	= Req;
		this.curCount	= Req.count;
		this.version	= Req.version;
		this.isAddFavorite	= Req.isFavorite;
		var hasAppend	= false;
		var childNodes	= document.body.childNodes;
		if (childNodes && childNodes.length > 0) {
			for (var n in childNodes) {
				if (childNodes[n].id == "cmus2012") {
					hasAppend = true;
					break;
				}
			}
		}
		
		// Is showing visiting page's coupon
		curShowCouponType	= SHOW_MERCHANT_COUPON;
		
		if (!hasAppend) {
			var cmusDiv	= document.createElement("div");
			cmusDiv.setAttribute("id", "cmus2012");
			cmusDiv.innerHTML	= Html.getWhole(Req);
			document.body.appendChild(cmusDiv);
		} else {
			// If is search engine page and push data is empty, clear exist push merchant icon <Effect in google>
			if (Req.pageType == PT_SEARCH_ENGINE_PAGE) {
				Animate.clearPushIcon();
				// Has unExpanded push coupon, expand it
				if (Req.push && Req.push.length > 0) {
					var pushHtml	= Html.getPush(Req.pushStatus, Req.push);;
					if (pushHtml) $("#cmus2012_iconStart").after(pushHtml);
				}
			}
		}
		
		// Show clicked push merchant coupon, If merchant from click PushMer icons
		Context.showClickPushCoupon();
	},
	
	showClickPushCoupon: function() {
		Context.sendRequest({reqType:"getClickedMerId"}, function(Res){
			if (!Res.merIds || Res.merIds.length < 1) {
				return false;
			}
			var curMerId	= Context.reqData.merId;
			for (var i in Res.merIds) {
				if (Res.merIds[i] == curMerId) {
					// When visiting page's merchantID in clickedPushMerIds, show coupon list
					Animate.showCouponList();
					// Remove merId from clickedPushMerIds, when show coupon list
					Context.sendRequest({reqType:"removeClickedMerId", merId: curMerId});
					break;
				}
			}
		});
	},
	
	getDetailPageItem: function(Msg, isLoaded) {
		
		var retCode		= XPATH_DEFAULT;
		var items		= [];
		var errorArr	= [];
		var prodName	= "";
		var merRuleId	= Msg.pageRegular.id;
		
		// Get product name and add it to response data
		pNames = this.getProdName(Msg.pageRegular.itemXpath);
		if (pNames && pNames.length > 0) {
			prodName	= pNames[0];
			retCode		= XPATH_SUCCESS;
		} else if (isLoaded) {
			retCode		= XPATH_DOM_COMPLETE;
			errorArr	= Msg.pageRegular.itemXpath;
		} else {
			retCode	= XPATH_DOM_LOADING;
		}
		Mix.log("product name: "+ pNames);
		
		// Detail page <On line>
		if (Msg.matchType === MT_ON_LINE && (retCode === XPATH_SUCCESS || isLoaded) && Msg.couponRegular && Msg.couponRegular.length > 0) {
			Mix.log("Online match");
			var matchResult	= this.getXpathItem(Msg.couponRegular, Msg.pageRegular.id);
			retCode		= matchResult.retCode;
			items		= matchResult.items;
			if (matchResult.error && matchResult.error.length > 0) {
				errorArr	= matchResult.error;
			}
			Mix.log("Match result: ", matchResult);
		}
		
		return {"retCode": retCode, "prodName": prodName, "items": items, "error": errorArr, "merRuleId": merRuleId};
	},
	
	getCartPageItem: function(Msg, isLoaded) {
		var retCode		= XPATH_DEFAULT;
		var errorArr	= [];
		var prodNames	= [];
		var merRuleId	= Msg.pageRegular.id;
		var names = this.getProdName(Msg.pageRegular.itemXpath);
		if (names && names.length > 0) {
			prodNames = names;
			retCode	= XPATH_SUCCESS;
		} else if (isLoaded) {
			retCode		= XPATH_DOM_COMPLETE;
			errorArr	= Msg.pageRegular.itemXpath;
		} else {
			retCode	= XPATH_DOM_LOADING;
		}
		
		return {"retCode": retCode, "prodNames": prodNames, "error": errorArr, "merRuleId": merRuleId};
	},
	
	getSearchPageItem: function(Msg, isLoaded) {
		var retCode		= XPATH_DEFAULT;
		var errorArr	= [];
		var resItemUrl	= [];
		var resKeyword	= "";
		var pageXpath	= Msg.pageRegular.xpath;
		var merRuleId	= Msg.pageRegular.id;
		
		// Close coupon list <Google still show openning coupon when goto next page>
		Animate.hideCouponList();
		
		if (pageXpath && pageXpath.length > 0) {
			// Get search item url<domain>
			var itemUrl = this.getSeItemUrl(pageXpath);
			if (itemUrl && itemUrl.length > 0) {
				retCode	= XPATH_SUCCESS;
				resItemUrl = itemUrl;
			} else if (isLoaded) {
				retCode	= XPATH_DOM_COMPLETE;
				errorArr.push(pageXpath[0]);
			} else {
				retCode	= XPATH_DOM_LOADING;
			}
			// Get search keyword
			var kwXpath = pageXpath[2];
			if (kwXpath && kwXpath.length > 0 && (retCode === XPATH_SUCCESS)) {
				try {
					var iterator = document.evaluate(kwXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
					var node = iterator.iterateNext();
					Mix.log("Search keyword xpath: " + kwXpath);
					if (node) {
						var kw = node.value;
						resKeyword = kw;
						Mix.log("Search keyword: " + kw);
					} else {
						errorArr.push(kwXpath);
					}
				} catch (e) {
					errorArr.push(kwXpath);
					Mix.log('Get search keyword error!!', e);
				}
			}
		} else {
			// Xpath error
			retCode	= XPATH_ERROR;
		}
		
		return {"retCode": retCode, "xpath": pageXpath, "itemUrl": resItemUrl, "keyword": resKeyword, "error": errorArr, "merRuleId": merRuleId};
	},
	
	// Get detail page or shopping cat page 's product(item) name
	// Return a product name array
	getProdName: function(xpath) {
		var xpathArr = [];
		var nameArr = [];
		if (!xpath) {
			return nameArr;
		}
		
		if (typeof xpath === "string") {
			xpathArr.push(xpath);
		} else {
			xpathArr = xpath;
		}
		
		for (var i in xpathArr) {
			try {
				var iterator = document.evaluate(xpathArr[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var node = iterator.iterateNext();
				if (node) {
					while (node) {
						var name = node.textContent;
						name	 = name.replace(/\r|\n|\t/g, '');
						name	 = name.replace(/\s+/g, ' ');
						nameArr.push(name);
						node = iterator.iterateNext();
						Mix.log(name);
					}
				} else {
					Mix.log("Not get product name", "Item xpath: " + xpathArr[i]);
				}
			} catch (e) {
				Mix.log('Get product name error !!', "Item xpath: " + xpathArr[i], e);
			}
		}
		
		return nameArr;
	},
	
	// Detail page get coupon xpaths refer items <On line match>
	getXpathItem: function(xpathArr, merRuleId){
		var items		= [];
		var retCode		= XPATH_SUCCESS;
		var errorArr	= [];
		if (typeof xpathArr == "string") {
			xpathArr	= [{id:0, xpath:xapthArr}];
		}
		
		// Execute each xpath, get refer items
		for (var i in xpathArr) {
			var curXpath	= xpathArr[i].xpath;
			var curXpathId	= xpathArr[i].id ? xpathArr[i].id : 0;
			var nodeText	= '';
			if (!curXpath || curXpath.length < 1 || curXpath == "undefined") continue;
			
			// Get node text
			var iterator = document.evaluate(curXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();

			// Not get node, xpath error
			if (!node) {
				retCode	= XPATH_ERROR;
				errorArr.push({xpath:curXpath, id:curXpathId});
			}
			
			while (node) {
				nodeText	+= node.textContent;
				node		= iterator.iterateNext();
			}
			// Trim node text
			nodeText	= nodeText.replace(/\n\r/g, '');
			items.push({xpath: curXpath, item: nodeText});
			
			Mix.log("Xpath: "+ curXpath, "NodeText: " + nodeText);
		}
		
		return {"retCode": retCode, "items": items, "error": errorArr, "merRuleId": merRuleId};
	},
	
	getSeItemUrl: function(xpath) {
		var itemUrlArr	= [];
		var itemXpath	= xpath[4];
		var itemNo		= 0;
		
		try {
			var iterator = document.evaluate(itemXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();
			Mix.log("Item node xpath: " + itemXpath);
			// Iterate all result item node <li>
			while (node) {
				itemNo++;
				// Get node's cite url
				var citeXpath	= itemXpath + "["+itemNo+"]" + xpath[0];
				var CiteIter	= document.evaluate(citeXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var CiteNode	= CiteIter.iterateNext();
				Mix.log("Item cite<url> xpath: " + citeXpath);
				if (CiteNode) {
					var itemUrl = CiteNode.innerText;
					itemUrl		= itemUrl.replace(/\s+/g, '');
					itemUrlArr.push(itemUrl);
					Mix.log("Get search result item, <URL>: " + itemUrl);
				}
				
				// Move to next item node
				node = iterator.iterateNext();
			}
		} catch (e) {
			Mix.log('Match search engine page result error <getURL> !!', e);
		}
		
		return itemUrlArr;
	},
	
	appendSeCoupon: function(Data) {
		var xpathArr	= Data.xpath;
		var couponArr	= Data.coupon;
		var retCode		= XPATH_SUCCESS;
		var errorXpath	= [];
		var itemUrlArr	= [];
		var itemXpath	= xpathArr[4];
		var itemNo		= 0;
		var itemCount	= 0;
		
		try {
			var iterator = document.evaluate(itemXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
			var node = iterator.iterateNext();
			Mix.log("Item node xpath: " + itemXpath);
			// Iterate all result item node <li>
			while (node) {
				itemCount++;
				// Move to next item node
				node = iterator.iterateNext();
			}
		} catch (e) {
			retCode	= XPATH_ERROR;
			errorXpath.push(itemXpath);
			Mix.log('Match list item error <getURL> !!', e);
		}
		
		while (itemNo < itemCount) {
			itemNo++;
			var itemUrl	= "";
			var citeXpath	= itemXpath + "["+itemNo+"]" + xpathArr[0];
			
			// Get node's cite url
			try {
				var CiteIter	= document.evaluate(citeXpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var CiteNode	= CiteIter.iterateNext();
				Mix.log("Item cite<url> xpath: " + citeXpath);
				if (CiteNode) {
					itemUrl = CiteNode.innerText;
					itemUrl		= itemUrl.replace(/\s+/g, '');
					itemUrlArr.push(itemUrl);
					Mix.log("Get search result item, <URL>: " + itemUrl);
				}
			} catch (eCite) {
				retCode	= XPATH_ERROR;
				errorXpath.push(citeXpath);
				Mix.log('Match item url<cite> error <getURL> !!', eCite);
				break;
			}
			
			// If node cite has coupon append it to title
			for (var j in couponArr) {
				if (couponArr[j].count > 0 && itemUrl == couponArr[j].url) {
					Mix.log("Current url has coupon code:"+couponArr[j].count);
					// Append coupon info to cite url's end
					try {
						this.appendHtmlToTitle(CiteNode, couponArr[j]);
					} catch (eAppend) {
						Mix.log('Append coupon info to cite url error !!', eAppend);
					}
					// Find url's coupon
					break;
				}
			}
		}
		
		return {"retCode": retCode, "error": errorXpath, "tabUrl": Data.url, "tabId": Data.tabId};
	},
	
	appendHtmlToTitle: function(CiteNode, Coupon) {
		if (!CiteNode || !Coupon) {
			return false;
		}
		
		Mix.log("Matched url :" + Coupon.url + ' -- count:' + Coupon.count);
		// If already appended coupon number to item title, don't append again
		var hasAppend = false;
		var childNodes = CiteNode.childNodes;
		if (childNodes && childNodes.length > 0) {
			for (var n in childNodes) {
				if (typeof childNodes[n].getAttribute == "function" && 
					(childNodes[n].getAttribute("class") == "cmus_pl") || childNodes[n].name == "cmus_sitelink") {
					hasAppend = true;
				}
			}
		}
		
		if (!hasAppend) {
			var appDom	= null;
			// CouponMountain link
			if (Coupon.count == 5050) {
				appDom	= document.createElement("a");
				appDom.setAttribute("href", Coupon.link);
				appDom.setAttribute("target", "_blank");
				appDom.setAttribute("name", "cmus_sitelink");
				appDom.innerHTML	= '<img src="'+ Coupon.img +'" style="margin-bottom: -4px; margin-left: 5px; border: 0px;">';
			} else {
				appDom = document.createElement("img");
				appDom.setAttribute("src", Coupon.img);
				appDom.setAttribute("class", "cmus_pl");
				appDom.setAttribute("tagUrl", Coupon.url);
				appDom.setAttribute("idx", Math.random());
				appDom.setAttribute("style", "margin-bottom: -4px; margin-left: 5px; border: 0px; cursor: pointer;");
			}
			CiteNode.appendChild(appDom);
		}
	},
	
	appendSeMerCoupon: function(Request) {
		var errorXpath	= [];
		var retCode		= XPATH_SUCCESS;
		var topClass	= "cmus cmusGoogleWp";
		var className	= "cmusGogle";
		var tabUrl		= Request.url.toLowerCase();
		if (tabUrl.indexOf("google.com") > 0) {
			topClass	= "cmus cmusGoogleWp";
			className	= "cmusGogle";
		} else if (tabUrl.indexOf("bing.com") > 0) {
			topClass	= "cmus cmusBingWp";
			className	= "cmusBing";
		} else if (tabUrl.indexOf("yahoo.com") > 0) {
			topClass	= "cmus cmusYahooWp";
			className	= "cmusYahoo";
		}
		
		if (Request.xpath && Request.xpath[3] && Request.count > 0) {
			var xpath = Request.xpath[3];
			try {
				var iterator = document.evaluate(xpath, document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
				var node = iterator.iterateNext();
				if (node) {
					var cmusObj	= document.getElementsByClassName("cmus");
					if (!cmusObj || cmusObj.length < 1) {
						var tips	= Request.count == 1 ? " coupon from " : " coupons from ";
						// Create span
						var infoSpan	= document.createElement("span");
						infoSpan.setAttribute("class", topClass);
						var innerHtml	= '<span class="'+ className +'">';
						innerHtml		+= '<span class="keyword">'+ Request.merName +'</span> has ';
						innerHtml		+= '<a href="'+ Request.merUrl +'" target="_blank"><img src="'+ Request.matchedNumUrl +'" valign="middle" border="0" /></a>';
						innerHtml		+= '</span>'+ tips +'<a href="'+ Request.merUrl +'" target="_blank">CouponMountain.com</a>';
						innerHtml		+= '</span>';
						infoSpan.innerHTML	= innerHtml;
						// Append to search result
						node.appendChild(infoSpan);
						Mix.log("Get search result div. xpath: " + xpath);
					} else {
						Mix.log("Search result refer coupon div already exist !!");
					}
				} else {
					retCode	= XPATH_ERROR;
					errorXpath.push(xpath);
					Mix.log("Not search result div !! xpath: " + xpath);
				}
			} catch (e) {
				retCode	= XPATH_ERROR;
				errorXpath.push(xpath);
				Mix.log('Match search total result div error !!', e);
			}
		}
		
		return {"retCode": retCode, "error": errorXpath, "tabUrl": Request.url, "tabId": Request.tabId};
	},
	
	// Copy coupon code to clipboard
	copyCode: function() {
		var curCoupon	= Context.selectedCoupon;
		if (curCoupon && curCoupon.code) {
			Context.curCopiedCoupon	= curCoupon;
			Context.sendRequest({reqType: "copyCode", code: curCoupon.code}, function(Res){
				var tips	= "";
				if (Res.ret) {
					tips	= tipsCopyCodeSucc;
					// Call coupon affiriate url in iframe, when copy code 
					$("#cmus2012_callLink").attr("src", curCoupon.link);
				} else {
					tips	= tipsCopyCodeFail;
				}
				$(".cmus2012_codeL").next().addClass("cmus_tipboxcopied").text(tips);
				Mix.log("Copy coupon code to clipboard is : "+ Res.ret);
			});
		} else {
			Mix.log("Copy coupon code false, don't get code");
		}
	},
	
	// Fill coupon code to inputbox 
	fillCode: function() {
		var curCoupon	= Context.selectedCoupon;
		if (curCoupon && curCoupon.code) {
			var pageReg	= Context.reqData.pageRegular;
			// If has input xpath, fill code
			if (pageReg && pageReg.inputXpath && pageReg.inputXpath.length > 0 && pageReg.inputXpath[0]) {
				/******************************** Execute fill code action <start> *********************/
				var retCode		= XPATH_SUCCESS;
				var errorXpath	= [];
				var xpathArr	= pageReg.inputXpath;
				// Fill coupon code to input box
				for(var i in xpathArr) {
					try {
						var iterator = document.evaluate(xpathArr[i], document, null, XPathResult.UNORDER_NODE_ITERATOR_TYPE, null);
						var node = iterator.iterateNext();
						if (node) {
							node.setAttribute("value", curCoupon.code);
							Mix.log("Get coupon code input, <name>: " + node.getAttribute("name"));
							Mix.log("Input xpath: " + xpathArr[i]);
							Mix.log("Coupon code: " + curCoupon.code);
							break;
						} else {
							retCode	= XPATH_ERROR;
							errorXpath.push(xpathArr[i]);
							Mix.log("Not get coupon code input name");
							Mix.log("Input xpath: " + xpathArr[i]);
						}
					} catch (e) {
						retCode	= XPATH_ERROR;
						errorXpath.push(xpathArr[i]);
						Mix.log('Match code input box error !!', e);
					}
				}
				// If xpath error send to server
				if (errorXpath.length > 0) {
					Context.sendRequest({"reqType": "logErrorXpath", "retCode" : retCode, "error": errorXpath, "merRuleId": Res.ret.id});
				}
				/******************************** Execute fill code action <end> *********************/
			} else {
				Mix.log("Doesn't fill coupon code, don't get inputbox's xpath");
			}
		} else {
			Mix.log("Doesn't fill coupon code, don't get code");
		}
	},
	
	fbShare: function() {
		var title=encodeURIComponent("I just saved money with Coupon Digger");
		var url=encodeURIComponent("http://www.couponmountain.com/chromePluginTutorial.html");
		var summary=encodeURIComponent("Dedicated to saving people money for over a decade, Coupon Mountain should be your first stop for finding coupon codes.");
		var image=encodeURIComponent("http://files.couponmountain.com/add/couponmountain_logo.jpg");

		window.open('http://www.facebook.com/sharer.php?s=100&p[title]='+title+'&p[summary]='+summary+'&p[url]='+url+'&p[images][0]='+image, 'sharer', 'toolbar=0,status=0,width=620,height=280');         
	},
	
	removeMerId: function(merId, callback){
		merId	= parseInt(merId);
		
		if (Number.isNaN(merId)) {
			// Remove from setting
			var $this	= $(this);
			merId	= $this.attr("merId");
			if (!merId) return false;
			
			$this.parent().hide(1200);
		}
		// else, Remove from push icon option
		
		Context.sendRequest({reqType: "removeFavorite", merId: merId}, function(Res){
			Context.followCount	= Res.count;
			if (Res.count == 0) {
				$(".headline").text("No followed merchant");
			}
			
			var $newFavCls	= "";
			// Remove current merchant
			if (merId == Context.reqData.merId) {
				Context.isAddFavorite	= 0;
				$newFavCls	= "unfollow";
			// Remove other merchant
			} else {
				// Current merchant is followed, keep followed
				if (Context.isAddFavorite == 1) {
					$newFavCls	= "followed";
				// Current merchant not followed
				} else {
					if (Res.count < 5) {
						$newFavCls	= "unfollow";
					} else {
						$newFavCls	= "followfull";
					}
				}
			}
			$("#cmusFollowOpt").attr("class", $newFavCls);
			
			if (typeof callback == "function") {
				callback();
			}
		});
	},
	
	// Switch visiting page's merchant favorite/follow status
	switchFollowStatus: function(){
		Animate.closeSetting(true);
		
		var merId	= Context.reqData.merId;
		var merName	= Context.reqData.merName;
		if (!merId) return false;
		var $class	= $(this).attr("class");
		var tips	= "";
		var $newCls	= "";
		var reqType	= "";
		
		// Full Follow
		if ($class == "followfull") {
			tips	= "you have followed 5 max merchants";
			$("#cmusFollowTips").text(tips);
			$(".cmus_popup_b").show().delay(5e3).fadeOut();
			return false;
		}
		
		switch ($class)  {
			case "unfollow":
				tips	= merName + " followed";
				reqType	= "addFavorite";
				$newCls	= "followed";
				break;
			case "followed":
				tips	= merName + " not followed";
				reqType	= "removeFavorite";
				$newCls	= "unfollow";
				break;
		}
		
		Context.sendRequest({reqType: reqType, merId: merId}, function(Res){
			Context.followCount	= Res.count;
			if (Res.count == 0) {
				$(".headline").text("No followed merchant");
			}
			
			if (Res.ret == 0) {
				Context.isAddFavorite	= (reqType == "addFavorite") ? 1 : 0;
				$("#cmusFollowOpt").attr("class", $newCls);
				$("#cmusFollowTips").text(tips);
				$(".cmus_popup_b").show().delay(5e3).fadeOut();
			} else {
				$("#cmusFollowTips").text("Follow "+ merName + " false");
				$(".cmus_popup_b").show().delay(5e3).fadeOut();
			}
		});
	},
	
	switchPushStatus: function(){
		var isTurnOn	= Context.isTurnOnPush;
		var reqType		= isTurnOn ? "turnOffPush" : "turnOnPush";
		chrome.extension.sendRequest({reqType: reqType}, function(Res){
			if (Res.ret == 0) {
				var cls	= isTurnOn ? "off" : "on";
				Context.isTurnOnPush	= !isTurnOn;
				$("#cmusPushOn").attr("class", cls);
				
				// If turn off push, hide push merchant icon, else show icon
				if (cls == "off") {
					// Turn off, hide
					$(".cmus2012_Icons").each(function(i, e){
						$this	= $(e);
						if ($this.attr("id") != "cmus2012_couponIcon") {
							$this.hide(400);
						}
					});
				} else {
					// Turn on, show
					$(".cmus2012_Icons").each(function(i, e){
						$this	= $(e);
						if ($this.attr("id") != "cmus2012_couponIcon") {
							$this.show(400);
						}
					});
				}
			}
		});
	},
	
	// When click push icon, goto merchant site
	gotoMerSite: function(merId, tagUrl){
		$this		= $(this);
		var merId	= $this.attr("merId");
		var tagUrl	= $this.attr("tagUrl");
		if (!merId || merId.length < 1 || !tagUrl || tagUrl.length < 1) return false;
		
		Context.sendRequest({reqType:"pushClick", merId:merId, tagUrl: tagUrl});
	},
	
	// On search engine page, when click item matched coupon num pic, get this merchant coupons
	getSeNumCoupon: function(e){
		var $this	= $(this);
		var tagUrl	= $this.attr("tagUrl");
		var index	= $this.attr("idx");
		var pageX	= e.pageX + 15;
		var pageY	= e.pageY - 20;
		var lastItem	= Context.curShowSeItem;
		if (!tagUrl || tagUrl.length < 1) return false;
		
		// If current clicked item's refer coupon is exit, simple show/hide it
		if (lastItem && tagUrl == lastItem.url && lastItem.coupon) {
			var isAutoHeight	= lastItem.coupon.length < 9 ? true : false;
			curShowCouponType	= SHOW_SEARCH_COUPON;
			// Click the same item
			if (index == lastItem.index) {
				if (isShowingCoupon) {
					Animate.hideCouponList();
				} else {
					Animate.showCouponList(pageX, pageY, isAutoHeight);
				}
			// Click the other item which has the same merchant url
			} else {
				if (isShowingCoupon) {
					Animate.hideCouponList();
				}
				Animate.showCouponList(pageX, pageY, isAutoHeight);
			}
		// Requst and show clicked item's coupon
		} else {
			var ReqData	= {"reqType": "getSeNumCoupon", "tagUrl": tagUrl};
			Context.sendRequest(ReqData, function(Res){
				if (Res && Res.count && Res.count > 0) {
					Context.curShowSeItem	= {url: tagUrl, index: index, coupon: Res.coupon};
					curShowCouponType	= SHOW_SEARCH_COUPON;
					var isAutoHeight	= Res.coupon.length < 9 ? true : false;
					var merName			= Res.merName && Res.merName.length > 0 ? Res.merName : "Merchant";
					var listHtml		= Html.getCouponList(Res.count, merName, Res.coupon, true);
					
					$("#cmus2012_couponList").html(listHtml);
					$(".cmus2012_couponList_bot").show();
					Animate.showCouponList(pageX, pageY, isAutoHeight);
				}
			});
		}
	},
	
	forbidPush: function() {
		Animate.hideSnoozeOption();
		var $icon	= $(this).parent().parent().parent();
		var merId	= $icon.find(".cmus2012_other").attr("merId");
		if (!merId) return false;
		Context.removeMerId(merId, function(){
			$icon.remove();
			Animate.hideIconTips();
		});
	},
	
	snoozePush: function() {
		Animate.hideSnoozeOption();
		var $icon	= $(this).parent().parent().parent();
		var merId	= $icon.find(".cmus2012_other").attr("merId");
		if (!merId) return false;
		Context.sendRequest({reqType: "snoozePush", merId: merId}, function(Res){
			if (Res && Res.ret != 0) return false;
			$icon.remove();
			Animate.hideIconTips();
		});
	},
	
	
	
};




chrome.extension.onRequest.addListener(function(Request, sender, sendResponse) {
	if (!Request || (!Request.reqType && !Request.pageType) || Request.ret != 0) {
		sendResponse({ret: -1});
		return false;
	}
	
	switch (Request.reqType) {
		// Embed plugin<html> to current page
		case PT_EMBED_COUPON:
			Context.embedCoupon(Request);
			sendResponse({ret: 0});
			break;
		case PT_SEARCH_APPEND_COUPON:
			Context.appendSeCoupon(Request);
			sendResponse({ret: 0});
			break;
		case PT_SEARCH_APPEND_MERNUM:
			var respond	= Context.appendSeMerCoupon(Request);
			sendResponse(respond);
			break;
		case PT_UPDATE_PUSH:
			Animate.updatePush(Request);
			sendResponse({ret: 0});
			break;
		default:
			sendResponse({ret: -1});
			break;
	}
});


chrome.extension.onConnect.addListener(function(Port){
	// Receive message
	Port.onMessage.addListener(function(Msg) {
		var isLoaded	= (document.readyState === "complete") ? true : false;
		
		if (!Msg || (!Msg.reqType && !Msg.pageType)) {
			Port.postMessage({ret: -1});
			return false;
		}
		
		switch (Msg.pageType) {
			case PT_DETAIL_PAGE:
				var respond	= Context.getDetailPageItem(Msg, isLoaded);
				Port.postMessage(respond);
				break;
			case PT_CART_PAGE:
				var respond	= Context.getCartPageItem(Msg, isLoaded);
				Port.postMessage(respond);
				break;
			case PT_SEARCH_ENGINE_PAGE:
				var respond	= Context.getSearchPageItem(Msg, isLoaded);
				Port.postMessage(respond);
				break;
			default:
				Port.postMessage({ret: -1});
				break;
		}
	});
});


//document.addEventListener('DOMContentLoaded', function(){});
$(document).ready(function(){
	//Show coupon list when click cmus_icon
	$("#cmus2012_couponIcon").live("click", function(){
		if (Context.curCount < 1) return false;
		if (isShowingCoupon) {
			Animate.hideCouponList();
		} else {
			Animate.showCouponList();
		}
	}).live("mouseenter", Animate.showCurMerIconTips).live("mouseleave", Animate.hideCurMerIconTips);
	
	// Close coupon list
	$(".cmus2012_close").live("click", function(){
		Animate.hideCouponList();
	});
	
	// Add coupon description
	$(".cmus2012_couponTitleLk").live("click", Animate.expandDetail);
	
	// Copy && Fill coupon code <Mouse on code>
	$(".cmus2012_codeL").live("click", function(e){
		Context.copyCode();
		Context.fillCode();
	}).live("mouseenter", Animate.mouseOverCode).live("mouseleave", Animate.mouseOutCode);
	// Copy && Fill coupon code <Mouse on tips>
	$(".cmus_tipbox").live("click", function(e){
		Context.copyCode();
		Context.fillCode();
	}).live("mouseenter", Animate.mouseOverCodeTips).live("mouseleave", Animate.mouseOutCode);
	
	// Fackbook share
	$(".sharetofacebook").live("click", Context.fbShare);
	
	// Remove one favorite merchant from list
	$(".cmusRemoveMerId").live("click", Context.removeMerId);
	// Add/Remove favorite
	$("#cmusFollowOpt").live("click", Context.switchFollowStatus);
	
	// Setting option
	$(".setting").live("click", Animate.showSetting);
	// Close setting option layer
	$(".cmus_closesetting").live("click", function(){
		Animate.closeSetting(false);
	});
	
	// Show help info
	$(".cmus_help").live("click", Animate.help);
	
	// Turn on/off alert/push status
	$("#cmusPushOn").live("click", Context.switchPushStatus);
	
	// Show push merchant icon tips, add click event
	$(".cmus2012_other").live("click", Context.gotoMerSite)
	.live("mouseenter", Animate.showIconTips).live("mouseleave", Animate.hideIconTips);
	
	// Get search engine coupon number's detail coupon
	$(".cmus_pl").live("click", Context.getSeNumCoupon);
	
	// Mouse over/out coupon list div
	$("#cmus2012_couponList, #cmus2012_iconsList, .cmus_pl").live("mouseenter", function(){
		isOnCouponList	= true;
	}).live("mouseleave", function(){
		isOnCouponList	= false;
	});
	
	// Click out of coupon list div hide it
	$("body").click(function(){
		if (!isOnCouponList && isShowingCoupon) {
			Animate.hideCouponList();
		}
		if (!isOnSnoozeDiv && isShowingSnooze) {
			Animate.hideSnoozeOption();
		}
	});
	
	// Push new coupon merchant icon close button event
	$(".cmus2012_closealert").live("mouseenter", function(){
		var $this	= $(this);
		Animate.showIconCloseBtn($this.parent(), $this.prev(".cmus2012_other").attr("merId"));
	}).live("mouseout", function(){
		var $this	= $(this);
		Animate.hideIconCloseBtn($this.parent(), $this.prev(".cmus2012_other").attr("merId"));
	}).live("click", function(){
		Animate.showSnoozeOption($(this).next(".cmus2012_closealertwp"));
	});
	
	// Snooze option event
	$(".cmus2012_closealertwp").live("mouseenter", function(){
		isOnSnoozeDiv	= true;
	}).live("mouseleave", function(){
		isOnSnoozeDiv	= false;
	});
	$(".cmusIconSnooze").live("click", Context.snoozePush);
	$(".cmusIconForbid").live("click", Context.forbidPush);
	
});

}//end conten page
