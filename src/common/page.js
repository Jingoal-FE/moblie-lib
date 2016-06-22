/**
 * @file page.js
 * @author deo (denglingbo@126.com)
 *
 */

var config = require('../config');
var view = require('./view');
var util = require('./util');
var storage = require('./localstorage');
var Control = require('./control');
var lang = require('./lang');
var log = require('./log');
var md5 = require('dep/md5');

// ** 调用 jingoal 重写的 ajax 包 ** //
require('common/mbreq');

if (!window.pageLog) {
    window.pageLog = {};
    window.isDeviceready = false;
}

/**
 * 不储存空数据
 *
 * @param {string} key, url query key
 * @return {string|null}
 */
var checkParamNull = function (key) {
    var ls = storage.getData(config.const.PARAMS);

    if (!ls) {
        return '';
    }

    var param = $.trim(util.params(key));
    var lsData = ls && ls[key] ? ls[key] : '';

    if (param === undefined || param === null || param.length <= 0) {

        if (lsData) {
            return lsData;
        }

        return '';
    }

    return param || lsData;
};

/**
 * 储存基础数据
 *
 * @return {Object}
 */
var getParams = function () {

    var data = {
        // uid 人员id
        uid: checkParamNull('uid'),
        // cid 公司id
        cid: checkParamNull('cid'),
        // lang 语言类型
        lang: checkParamNull('lang') || 'zh_CN',
        // puse 区分平台
        puse: checkParamNull('puse'),
        // app 版本号
        appver: checkParamNull('appver'),
        // client 客户端类型
        client: checkParamNull('client')
    };

    storage.addData(config.const.PARAMS, data);

    return data;
};

/**
 * 获取壳外的配置信息
 *
 * @param {Object} data, data
 * @return {Object} 壳外需要使用的配置
 */
var getShell = function (data) {
    var appVersion = navigator.appVersion;
    var shell = {
        right: {},
        left: {},
        // 判断是否是 苹果机器
        apple: appVersion && (/(iphone|ipad)/i).test(appVersion)
    };

    var iconPath = 'img/shell';

    // 判断 app
    if ((/(iphone|ipad)/i).test(navigator.appVersion)) {
        iconPath += '/ios';
    }
    else {
        iconPath += '/android';
    }

    if (data.appver && parseInt(data.appver, 10) >= 7) {
        iconPath += '/high';
    }
    else {
        iconPath += '/low';
    }

    shell.right.add = iconPath + '/add.png';
    shell.right.more = iconPath + '/more.png';

    return shell;
};

/**
 * Page
 *
 * @param {Object} opts 参数
 * @constructor
 */
function Page(opts) {

    Control.call(this, opts);

    /**
     * Tasks
     * @type {Array<Function>}
     */
    this.tasks = [];

    /**
     * 页面数据
     */
    this.data;

    this.lang = (lang && lang.data) || null;

    /**
     * 保存上一个页面传过来的数据
     */
    this._data;

    // 壳外配置
    this._shell;

    /**
     * 得到上一个页面的params
     */
    this.params;

    /**
     * 标识页面是否调用过done方法
     * @type {Boolean}
     */
    this.isDone = false;

    this.isFailed = false;

    this.opts = opts;

    this.domContentListener();

    // 监听设备就绪
    this.deviceListener();
}

util.inherits(Page, Control);

/**
 * 所有前序任务执行完毕之后，回调 enter
 *
 */
Page.prototype.enter = function () {};

/**
 * 设备就绪，回调 deviceready
 *
 */
Page.prototype.deviceready = function () {};

/**
 * DOMContentLoaded 就绪，在 css js loaded 之前，回调 domloaded
 *
 */
Page.prototype.domloaded = function () {};

/**
 * 设备就绪 同时 页面数据准备就绪，回调 allready
 *
 */
// Page.prototype.allready = function () {};


/**
 * 开始执行任务
 *
 * @return {Deferred}
 */
Page.prototype.start = function () {
    var me = this;
    var dfd = new $.Deferred();

    // 增加编译模板的任务
    if (!me.isDone) {
        window.pageLog.compileTemplateStart = Date.now();
        me.addParallelTask(function (dfd) {
            // 如果页面在这之前已经done过了，就不继续编译
            $('[type="x-tmpl-mustache"]').each(function (index, node) {
                var tmpl = node.innerHTML;
                // 通通拿出来预编译一发
                view.getRenderer(tmpl);
            });
            window.pageLog.compileTemplateEnd = Date.now();
            dfd.resolve();
        });
    }

    dfd.done(function () {

        // 执行任务
        me.execute()
            .done(function () {

                if (me.data && !me.data.lang) {
                    me.data.lang = me.lang;
                }

                // 页面逻辑
                me.enter();

                me.done();

                me.devicereadyEnter();

                dfd.resolve();
            })
            .fail(function () {
                // Do something
                me.failed();
                dfd.reject();
            })
            .always(function () {
                lang.parseDOM();
            });
    });

    me._data = getParams();
    me._shell = getShell(me._data);

    dfd.resolve();

    return dfd;
};

// var timeId = null;
// 5s 后设备为就绪，则认为失败
// var timeout = 5000;
// 设备就绪同时等待数据返回

/**
 * 设备就绪
 */
Page.prototype.deviceListener = function () {
    var me = this;

    // clearTimeout(timeId);

    // timeId = setTimeout(function () {
    //     document.removeEventListener('deviceready', readyFn);
    //     me.failed({code: 2, msg: 'deviceready timeout'});
    //     dfd.reject();
    // }, timeout);

    // -------------------------------------
    // 这里不适用于所有环境，此处为 cordova 服务
    // 等待 deviceready 完成
    // -------------------------------------
    window.pageLog.devicereadyStart = +new Date();
    document.addEventListener('deviceready', function () {
        window.isDeviceready = true;
        window.pageLog.devicereadyEnd = +new Date();
        me.devicereadyEnter();
    }, false);
};

/**
 * DOMContentLoaded 就绪
 */
Page.prototype.domContentListener = function () {
    var me = this;

    // -------------------------------------
    // 这里不适用于所有环境，此处为 cordova 服务
    // 等待 DOMContentLoaded 完成
    // -------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        me.domloaded();
    }, false);
};

/**
 * 设备准备完成的入口
 */
Page.prototype.devicereadyEnter = function () {
    // 虽然 deviceready 肯定比 enter 慢，但是为了避免意外，还是等待判断一下 是否 done
    if (this.isDone && window.isDeviceready) {
        this.deviceready();
    }
};

/**
 * Failed
 *
 * @param {Object} errObj, 错误信息
 */
Page.prototype.failed = function (errObj) {
    var me = this;

    var err = {
        code: 0,
        msg: 'failed'
    };

    $.extend(err, errObj);

    me.isFailed = true;

    // 掉线不发送错误 log
    if (err.code !== 1) {
        /* eslint-disable */
        log.send({
            'da_src': 'err: ' + err.msg + ' url: ' + window.location.href
                + ' pageLog: ' + util.qs.stringify(window.pageLog),
            'da_act': 'error'
        });
        /* eslint-enable */
    }

    // 页面失败逻辑
    me.error();
};

/**
 * 错误逻辑
 */
Page.prototype.error = function () {};

/**
 * Done
 */
Page.prototype.done = function () {
    this.isDone = true;

    log.init();
};

/**
 * 执行任务
 *
 * @return {Deferred}
 */
Page.prototype.execute = function () {
    var dfds = [];

    this.tasks.forEach(function (task) {
        dfds.push(task.$dfd);
        task();
    });

    return $.when.apply(null, dfds);
};

/**
 * 添加伪并行任务
 *
 * task第一个函数需要是 deferred，如下
 * ```javascript
 * page.addParallelTask(function (dfd) {
 *     dfd.resolve('success');
 * });
 * ```
 *
 * @param {Function} task 任务函数
 * @return {Page} 返回自身
 *
 */
Page.prototype.addParallelTask = function (task) {
    var me = this;
    var dfd = new $.Deferred();

    var fn = function () {
        task.call(me, dfd);
    };
    fn.$dfd = dfd;

    // 缓存任务函数
    fn.task = task;

    me.tasks.push(fn);

    return me;
};

/**
 * 渲染模板
 *
 * @param {string} selector, #id|.class|tagname
 * @param {Object} data, 数据
 * @param {string} options, see view.js
 * @return {string} html 字符串
 *
 */
Page.prototype.render = function (selector, data, options) {
    var str = view.render(selector, data, options);
    return str;
};

/**
 * 刷新页面
 *
 * @return {Deferred}
 */
Page.prototype.refresh = function () {
    var me = this;

    me.isRefresh = true;

    // 优先销毁事件
    me.disposeEvents();

    // 刷新任务
    var oldTasks = me.tasks;

    me.tasks = [];
    $.each(oldTasks, function (index, item) {
        me.addParallelTask(item.task);
    });

    return me.start();
};

/**
 * 获取请求参数并可以根据需求改变参数
 *
 * @param {string} api, 数据
 * @param {Object} data, 数据
 * @param {Object} opts, ajaxSettings
 * @return {Object} 请求配置对象
 */
var getRequestConfig = function (api, data, opts) {

    var r = {
        url: config.API.host + config.API.prefix + api
    };

    // 默认情况都需要带给 网关 的参数
    var defParams = storage.getData(config.const.PARAMS);
    var reqData = defParams;
    // url 上的参数
    var urlData = [];

    // get 请求下，所有的 params 拼接到 url 上
    if (/get/i.test(opts.type)) {
        reqData = $.extend(defParams || {}, data);
    }
    else {
        r.data = JSON.stringify(data);
    }

    // 拼接参数
    for (var p in reqData) {
        if (reqData.hasOwnProperty(p)) {
            urlData.push(p + '=' + reqData[p]);
        }
    }

    if (urlData.length > 0) {
        r.url = r.url + '?' + urlData.join('&');
    }

    return r;
};

/**
 * GET 请求入口，调用 ajax
 *
 * @param {number} api api号
 * @param {Object} data 请求数据
 * @param {Object} options 选项
 *      @param {string} options.url 请求的host
 * @return {Deferred}
 */
Page.get = function (api, data, options) {
    return this.ajax(api, data, $.extend(options || {}, {type: 'GET'}));
};

/**
 * POST 请求入口，调用 ajax
 *
 * @param {number} api api号
 * @param {Object} data 请求数据
 * @param {Object} options 选项
 *      @param {string} options.url 请求的host
 * @return {Deferred}
 */
Page.post = function (api, data, options) {
    return this.ajax(api, data, $.extend(options || {}, {type: 'POST'}));
};

/**
 * Ajax 请求数据
 * 注意 此处在请求前添加了防一个请求重复提交的过滤
 *
 * @param {number} api api号
 * @param {Object} data 请求数据
 * @param {Object} options 选项
 *      @param {string} options.url 请求的host
 * @return {Deferred}
 */
Page.ajax = function (api, data, options) {
    // var me = this;
    var dfd = new $.Deferred();
    // var isNetwork = util.isNetwork();

    var opts = {
        type: 'POST',
        dataType: 'json'
    };

    $.extend(opts, options);

    // 获取请求配置
    var reqConfig = getRequestConfig(api, data, opts);

    var ajaxSettings = {
        url: reqConfig.url,
        type: opts.type,
        dataType: opts.dataType,
        timeout: 5000,
        headers: {
            'campo-proxy-request': true,
            'x-spdy-bypass': true
        },
        contentType: 'application/json; charset=utf-8'
    };

    if (reqConfig.data) {
        ajaxSettings.data = reqConfig.data;
    }

    if (config.debug) {

        // 上面的2个 电脑端联调不能传递
        delete ajaxSettings.headers;

        // debug & 由 node 转发的时候 和后端联调跨域的情况下需要加如下配置
        if (!/^\/data/.test(config.API.prefix)) {
            ajaxSettings.xhrFields = {
                withCredentials: true
            };

            ajaxSettings.headers = {
                'set-cookie': config.mock.token
            };
        }

        if (!/post/i.test(ajaxSettings.type)) {
            delete ajaxSettings.contentType;
        }
    }

    ajaxSettings.success = function (result) {

        // Just debug test
        // 模拟网络延迟
        if (config.debug) {
            setTimeout(function () {
                dfd.resolve(result);
            }, 100);
        }
        else {
            dfd.resolve(result);
        }
    };

    ajaxSettings.error = function (err) {
        dfd.reject(err);
    };

    // 移除该请求
    ajaxSettings.complete = function () {
        if (config.debug) {
            setTimeout(function () {
                removeAjaxId(dfd.__ajaxId);
            }, 100);
        }
        else {
            removeAjaxId(dfd.__ajaxId);
        }
    };

    // 避免一个请求多次发送
    var ajaxId = createAjaxId(ajaxSettings);

    // 加入队列成功
    if (ajaxId) {
        dfd.__ajaxId = ajaxId;

        // 这里实际会经过 mbreq.js 重写
        $.ajax(ajaxSettings);

        /* eslint-disable */
        // console.info(ajaxSettings);
        /* eslint-enable */
    }
    else {
        dfd.reject();
    }

    return dfd;
};

/**
 * ajax 请求队列
 */
var ajaxQueue = [];

/**
 * 创建ajax id
 *
 * @param {Object} ajaxSettings, ajax 配置
 * @return {string|null} 成功则返回 ajaxId
 */
function createAjaxId(ajaxSettings) {

    try {

        // 判断是否是同一个请求
        // 如果是同一个请求，并且之前的请求还没有结束，则不再发送
        var ajaxId = $.isPlainObject(ajaxSettings)
                        ? md5(JSON.stringify(ajaxSettings))
                        : md5(ajaxSettings);

        // 判断请求是否在队列中
        if ($.inArray(ajaxId, ajaxQueue) === -1) {

            ajaxQueue.push(ajaxId);

            return ajaxId;
        }
    }
    catch (ex) {
        return 'CATCH-MD5-AJAXID-' + new Date().getTime();
    }

    return 'ERROR-MD5-AJAXID-' + new Date().getTime();
}

/**
 * 删除ajax id
 *
 * @param {Object} ajaxId, 要删除的 ajaxId
 * @return {boolean} 是否删除成功
 */
function removeAjaxId(ajaxId) {
    var index = $.inArray(ajaxId, ajaxQueue);

    if (index === -1) {
        return false;
    }

    ajaxQueue.splice(index, 1);

    return true;
}


Page.prototype.ajax = Page.ajax;
Page.prototype.post = Page.post;
Page.prototype.get = Page.get;

module.exports = Page;
