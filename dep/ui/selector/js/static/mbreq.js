/**
 * Created by yangll on 15/3/12.
 */

$ajax=$.ajax;
$.ajax=function(options){
    console.log(" ajax " + options);
    if(window.AndroidNativeClient){
        var settings = $.extend({}, options || {});
        for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]
		var port = window.location.port ? (':'+window.location.port ): '';
		if(port == ''){
			if(window.location.protocol.toLowerCase == 'http'){
				port = ':80';
			}else{
				port = ':443';
			}
		}
		console.log(" port:"+window.location.port);
		//options.url = window.location.protocol +"//"+window.location.host+port+options.url;
		options.url = window.location.protocol +"//"+window.location.host+options.url;
        if(options.type =='GET' && settings.data != undefined){
            options.url += settings.data;
        }
        console.log("options.url = "+options.url);
		var heads ;
		if(settings.headers)
			heads= JSON.stringify(settings.headers);
		else
			heads='';
		console.log("settings.headers:"+heads);
        MobiClient.postMsg(options.type,options.url,settings.data,settings.success,settings.error,heads);
    }else{//不在匹配的就正常匹配
        $ajax(options);
    }
}
;!(function(window , document , $){

    var Callbackable = function () {
        if (!(this instanceof Callbackable)) {
            return new Callbackable();
        }
        return this;
    };

    var AndroidClient = function (client) {
        if (!(this instanceof AndroidClient)) {
            return new AndroidClient(client);
        }
        console.log(" init androidclient =" + client);
        this.client = client;
        console.log(" init androidclient finish =" + this.client);
        return this;
    };

    var OtherClient = function(){
        if(!(this instanceof OtherClient)){
            return new OtherClient();
        }
        return this;
    }

    Callbackable.prototype = {
        callbackSerial: 0,
        callbacks: {},
        callback: function (callbackId, data) {
            try {
                this.callbacks[callbackId] && this.callbacks[callbackId](data);
                delete this.callbacks[callbackId];
            } catch (e) {

            }
        },
        registCallback: function (cb) {
            if (cb && typeof cb == 'function') {
                var callbackId = 'TYClient_' + ++this.callbackSerial;
                this.callbacks[callbackId] = cb;
                return callbackId
            } else {
                return null;
            }
        },
        errorCallback:function(cb){
            if (cb && typeof cb == 'function') {
                var callbackId = 'TYClient_' + ++this.callbackSerial;
                this.callbacks[callbackId] = cb;
                return callbackId
            } else {
                return null;
            }
        }
    }

    AndroidClient.prototype.alert = function (message) {
        this.client.alert(message);
    };
    AndroidClient.prototype = Callbackable();
    AndroidClient.prototype.postMsg = function(method,url ,data, cb,errorcb,heads) {
        var param = {
            method: method,
            url: url,
            data: data,
            success: this.registCallback(cb) || '',
            error: this.errorCallback(errorcb)||'',
            heads: heads
        }
        try{
            this.client.post(JSON.stringify(param));
        }catch(error){
            this.client.post(method, url, data, this.registCallback(cb) || '',this.errorCallback(errorcb)||'');
        }
    }
    var MobiClient = function () {
        if (!(this instanceof MobiClient)) {
            return new MobiClient();
        }
        console.log(" init MobiClient =" + this);
        return this;
    };
    if (window.AndroidNativeClient) {
        console.log(" window.AndroidNativeClient)=" + window.AndroidNativeClient);
        MobiClient.prototype = AndroidClient(window.AndroidNativeClient);
        console.log(" MobiClient.prototype " + MobiClient);
    }else{
        MobiClient.prototype = OtherClient();
    }
    window.MobiClient = MobiClient();
})(window,document,window.Zepto)