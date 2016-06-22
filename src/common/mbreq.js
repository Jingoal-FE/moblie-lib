/**
 * @file mbreq.js
 * @author yangll
 * @editor deo
 *
 * 重写 Ajax 请求
 */

/* eslint-disable */
(function (window, document) {

    var AndroidClient = function (client) {

        if (!(this instanceof AndroidClient)) {
            return new AndroidClient(client);
        }

        // console.log(' init androidclient =' + client);
        this.client = client;
        // console.log(' init androidclient finish =' + this.client);
        return this;
    };

    var OtherClient = function () {

        if (!(this instanceof OtherClient)) {
            return new OtherClient();
        }

        return this;
    };


    var Callbackable = function () {
        if (!(this instanceof Callbackable)) {
            return new Callbackable();
        }
        return this;
    };

    Callbackable.prototype = {

        callbackSerial: 0,

        callbacks: {},

        callback: function (callbackId, data) {
            try {
                this.callbacks[callbackId] && this.callbacks[callbackId](data);
                delete this.callbacks[callbackId];
            }
            catch (e) {}
        },

        registCallback: function (cb) {
            if (cb && typeof cb === 'function') {
                var callbackId = 'TYClient_' + ++this.callbackSerial;
                this.callbacks[callbackId] = cb;
                return callbackId;
            }
            return null;
        },

        errorCallback: function (cb) {
            if (cb && typeof cb === 'function') {
                var callbackId = 'TYClient_' + ++this.callbackSerial;
                this.callbacks[callbackId] = cb;
                return callbackId;
            }
            return null;
        }
    };

    AndroidClient.prototype.alert = function (message) {
        this.client.alert(message);
    };

    AndroidClient.prototype = Callbackable();

    AndroidClient.prototype.postMsg = function (method, url, data, cb, errorcb, heads) {

        var param = {
            method: method,
            url: url,
            data: data,
            success: this.registCallback(cb) || '',
            error: this.errorCallback(errorcb) || '',
            heads: heads
        };

        try {// alert(JSON.stringify(param))
            return this.client.post(JSON.stringify(param));
        }
        catch (error) {
            return this.client.post(
                method,
                url,
                data,
                this.registCallback(cb) || '',
                this.errorCallback(errorcb) || ''
            );
        }
    };

    var MobiClient = function () {
        if (!(this instanceof MobiClient)) {
            return new MobiClient();
        }

        // console.log(' init MobiClient');
        return this;
    };

    if (window.AndroidNativeClient) {
        // console.log(' window.AndroidNativeClient)=' + window.AndroidNativeClient);
        MobiClient.prototype = AndroidClient(window.AndroidNativeClient);
        // console.log(' MobiClient.prototype ' + MobiClient);
    }
    else {
        MobiClient.prototype = OtherClient();
    }

    // 提供手机端 请求
    window.MobiClient = MobiClient();
    // 上面的代码都由 linglong 大侠实现

    // yangll 对 Ajax 做了一次重写
    var $ajax = $.ajax;
    
    var loc = window.location;

    // var getPort = function () {
    //     var port = loc.port ? (':' + loc.port) : '';

    //     if (port === '') {
    //         if (loc.protocol.toLowerCase === 'http') {
    //             port = ':80';
    //         }
    //         else {
    //             port = ':443';
    //         }
    //     }

    //     return port;
    // };

    $.ajax = function (options) {
        // console.log('ajax ' + JSON.stringify(options));

        if (window.AndroidNativeClient) {
            var settings = $.extend({}, options || {});

            for (var key in $.ajaxSettings) {
                if ($.ajaxSettings.hasOwnProperty(key) && settings[key] === undefined) {
                    settings[key] = $.ajaxSettings[key];
                }
            }
            // console.log(' port:' + loc.port);
            // options.url = loc.protocol + '//' + loc.host + port + options.url;
            // options.url = loc.protocol + '//' + loc.host + options.url;

            if (options.type === 'GET' && settings.data !== undefined) {
                options.url += settings.data;
            }
            // console.log('options.url = '+options.url);
            var heads;

            if (settings.headers) {
                heads = JSON.stringify(settings.headers);
            }
            else {
                heads = '';
            }
            // console.log('settings.headers:'+heads);
            return window.MobiClient.postMsg(
                options.type,
                options.url,
                settings.data,
                settings.success,
                settings.error,
                heads
            );
        }

        // 不在匹配的就就使用 zepto 本身的 ajax
        return $ajax(options);
    };

    // if ( typeof module != 'undefined' && module.exports ) {
    //     module.exports = ;
    // } else if ( typeof define == 'function' && define.amd ) {
    //         define( function () { return ; } );
    // } else {
    //     window. = ;
    // }

})(window, document);
