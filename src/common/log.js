/**
 * @file log.js
 * @author deo
 *
 * 日志
 * <dom data-log='{"actionTag": "key name"}'
 *
 * log.store({actionTag: xxx, ...})
 */

var PRODUCT_TAG = 'task';
var KEY = 'TASK_LOG';
// 当本地队列长度大于等于 {num} 则发送
var SEND_LENGTH = 2;

/* eslint-disable */
var config = require('../config');
var util = require('common/util');
var localstorage = require('common/localstorage');

if (localstorage.getData(KEY) === null) {
    localstorage.addData(KEY, []);
}

var localLogArr = localstorage.getData(KEY) || [];

window.onerror = function (err, url, lineno) {

    /* i am tester */
    // var idx = url.lastIndexOf("/");  
    // if(idx > -1) {  
    //     url = url.substring(idx+1);  
    // }  
    // alert("ERROR in " + url + " (line #" + lineno + "): " + err);

    // 如果发生错误，则把错误信息打到日志里面
    /* eslint-disable */
    send({
        'actionTag': 'err: ' + err + ' url: ' + url + ' lineno: ' + lineno,
        'da_act': 'error'
    });
    /* eslint-enable */
};

var pro = document.location.protocol;

/**
 * 日志服务器 url
 *
 * @type {String}
 */
// <img src="http://192.168.10.152:8080/agent/log/logsend?topic=topic1&msg=qqq" />
var LOG_URL = config.debug
    ? pro + '//192.168.10.152:8445/agent/log/logsend'
    : pro + '//xx.gif';

/**
 * 默认参数
 */
var defaultOpts = {
    uid: util.getParam('uid'),
    cid: util.getParam('cid'),
    client: util.getParam('client'),
    puse: util.getParam('puse'),
    lang: util.getParam('lang'),
    appver: util.getParam('appver'),
    productTag: PRODUCT_TAG
};

/**
 * 日志储存到本地，等待发送
 *
 * @param  {Object} opts 日志参数对象
 */
function store(opts) {
    if (!opts) {
        return;
    }

    if (!$.isArray(localLogArr)) {
        localLogArr = [];
    }

    if (opts && !opts.time) {
        opts.time = +new Date();
    }

    localLogArr.push(opts);

    localstorage.addData(KEY, localLogArr || []);
}

/**
 * 根据队列中所存储的任务来发送
 */
function consume(queue, callback) {
    if (queue.length === 0) {
        return;
    }

    function execLog(params) {
        params = $.extend({}, defaultOpts, params || {});

        if (config.debug) {
            /* eslint-disable */
            console.log(params);
            /* eslint-enable */
            return;
        }

        // var q = util.qs.stringify(params);
        var q = JSON.stringify(params);

        var t = Date.now() + '' + Math.ceil(Math.random() * 10000);

        var url = LOG_URL + '?t=' + t  + '&msg=' + q + '&topic=topic1';

        var img = new Image();
        var key = 'img' + Date.now() + Math.ceil(Math.random() * 100);
        window[key] = img;

        img.onload = img.onerror = function () {
            delete window[key];
        };

        img.src = url;
    }

    for (var i = 0; i < queue.length; i++) {
        execLog(queue[i]);
    }
}

/**
 * 日志发送
 */
function send() {
    if (localLogArr && localLogArr.length >= SEND_LENGTH) {
        consume(localLogArr);

        // 发送之后清空 localstorge
        localstorage.addData(KEY, []);
    }
}

/**
 * 解析节点获得日志参数
 *
 * @param  {HTMLElement} ele 文档节点
 * @return {Object|undefined}  解析后的日志参数
 */
function parseLogData(ele) {
    var log = $(ele).data('log');
    var params = {};

    if (typeof log === 'string') {
        try {
            log = util.decodeHTML(log);
            log = util.JSON.parse(log);
        }
        catch (e) {
            log = {};
        }
    }

    if (typeof log === 'object') {
        var value;
        for (var key in log) {
            if (!log.hasOwnProperty(key)) {
                continue;
            }
            value = log[key];
            if (log.hasOwnProperty(key)) {
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
            }
            if (value) {
                params[key] = value.toString();
            }
        }

        /* eslint-disable fecs-camelcase */
        params.da_act = params.da_act || 'click';
        /* eslint-enable fecs-camelcase */

        return params;
    }
}

/**
 * 获取元素 index
 *
 * @param {HTMLElement} element dom元素对象
 * @return {number}
 */
function getIndex(element) {
    var prevSiblings = [];
    var prevSibling = element;
    var i = 0;
    while (prevSibling = prevSibling.previousSibling) {
        if (prevSibling.tagName === element.tagName) {
            prevSiblings[i++] = prevSibling;
        }
    }
    return prevSiblings.length;
}

/**
 * 获取元素的Xpath
 *
 * @param  {HTMLElement} target dom元素对象
 * @return {string}  xpath字符串
 */
function getXpath(target) {

    var path = [];
    var index = 0;

    while (target && target !== document.body) {

        var hasSiblings = !!$(target).siblings(target.tagName.toLowerCase()).length;

        var targetIndex = getIndex(target);

        path[index++] = target.tagName.toLowerCase() + (hasSiblings ? '[' + targetIndex + ']' : '');

        target = target.parentNode;

    }

    path.reverse();

    return '/html/body/' + path.join('/');
}

/**
 * 发送pv日志
 *
 * @param  {Object} opts 日志参数对象
 * @param {boolean} appendPageId 是否补上页面id，这个在手动发pv的时候可能会用上
 */
// function sendPv(opts, appendPageId) {
//     /* eslint-disable */
//     opts = $.extend({'act': 'ready'}, opts || {});
//     /* eslint-enable */
//     send(opts);
// }

/**
 * 初始化参数，传入页面的名称
 */
function init() {

    /* eslint-disable fecs-camelcase */
    // defaultOpts.actionTag = pageName || '';
    /* eslint-enable fecs-camelcase */

    // 发送PV日志, 如果不设置pageName则不主动发pv日志
    // pageName && sendPv();

    // 绑定事件到含有 data-log的节点
    var $body = $(document.body);

    $body.off('click');
    $body.on('click', '[data-log]', function (event) {
        var params = parseLogData(this);
        params.xpath = getXpath(this);

        // 储存
        store(params);
    });
}

// 触发发送
send();

module.exports = {
    init: init,
    send: send,
    store: store
};
