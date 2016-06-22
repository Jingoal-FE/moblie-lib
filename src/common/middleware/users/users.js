/**
 * @file users.js
 * @author deo
 *
 * 手机端的一些公用脚本，和原生进行交互的中间层
 */
var config = require('config');
var util = require('common/util');
var storage = require('common/localstorage');

var middleware = {};

/**
 * 获取 uid, uid 是在页面入口位置传递进来，并且通过 ls 进行持续保存
 *
 * @return {string} uid
 */
middleware.uid = function () {
    var data = storage.getData(config.const.PARAMS);

    if (!data) {
        return null;
    }

    var uid = util.params('uid') || data.uid;

    return parseInt(uid, 10);
};

/**
 * 获取 companyId, 优先使用 ls 的值，再使用传递的 cid (几乎不会传这个 ^.^)，同时覆盖 ls.cid
 *
 * @param {number} cid, companyId
 * @return {string} companyId
 *
 */
middleware.companyId = function (cid) {
    // localstorage
    var data = storage.getData(config.const.PARAMS);

    if (!data) {
        return null;
    }

    // 1. 后端传递的 cid
    if (cid !== undefined && cid !== null) {
        data.cid = cid;
        storage.addData(config.const.PARAMS, data);
        return cid;
    }

    // 2. ls or query params
    return util.params('cid') || data.cid;
};

/**
 * 把 id 拼装成 jid
 *
 * @param {number} id, 不带@ 的id
 * @param {number} cid, companyId
 * @return {string} id@companyId
 *
 */
middleware.makeJid = function (id, cid) {
    cid = cid || this.companyId(cid);

    if (cid === null) {
        return null;
    }

    return id + '@' + cid;
};

/**
 * 把 jid 拆解为 id
 *
 * @param {number} jid, 带@ 的jid
 * @return {string} id
 *
 */
middleware.takeJid = function (jid) {
    var jids = jid.toString().split('@');
    return jids && jids.length === 2 ? jids[0] : jid;
};

/**
 * 将一个数组中的所有项合并到一起
 * eg: [1, 2, [2, 3], ...]
 * eg: {a: 1, b: [1, 2], ...}
 *
 * @param {Array|Object} args, 要合并的数组
 * @return {Array} 合并过的数组
 *
 */
middleware.makeArray = function (args) {
    var temp = [];

    // 如果是对象，则只把 value 作为数组的项
    if ($.isPlainObject(args)) {
        for (var key in args) {
            if (args.hasOwnProperty(key)) {
                temp.push(args[key]);
            }
        }
    }
    // 数组 [1, 2, 3, [4, 5]]
    else if ($.isArray(args)) {
        temp = args;
    }
    // 单个值 1 or 'hello'
    else if (typeof args === 'number' || typeof args === 'string') {
        temp = [args];
    }
    // 未知情况，不做操作
    else {
        return args;
    }

    var arr = [];

    // 新数组
    temp.forEach(function (item) {
        if (typeof item === 'number' || typeof item === 'string') {
            arr.push(item);
        }
        if ($.isArray(item) && item.length > 0) {
            arr = arr.concat(item);
        }
    });

    return arr;
};

/**
 * 把两个数组中的对象合并到一个数组，同 id 的对象 合并
 *
 * @param {Array} arr1, 数组
 * @param {Array} arr2, 数组
 * @param {string} key, 匹配某个 key
 * @return {Array}
 *
 */
middleware.mergeObject2Array = function (arr1, arr2, key) {
    var arr = arr1;

    arr.forEach(function (arrItem) {

        arr2.forEach(function (arr2Item) {
            if (arrItem[key] === arr2Item[key]) {
                $.extend(arrItem, arr2Item);
            }
        });
    });

    return arr;
};

/**
 * 给没有 id 的 pubData.contacts 创建 id，用于前端展示
 *
 * @param {Array} arr, 数组
 */
function createIdFromJid(arr) {
    if (!arr) {
        return;
    }

    arr.forEach(function (item) {
        if (item.id === undefined && item.jid) {
            item.id = middleware.takeJid(item.jid);
        }
    });
}

/**
 * 封装原生接口 改为 deferred
 * 获取公共数据 统一 入口
 *
 * @param {Object} options, 原生配置
 * @return {Deferred}
 *
 */
middleware.getPubData = function (options) {
    var dfd = new $.Deferred();

    /* eslint-disable */
    CPPubData.getPubData(options, function (data) {

        if (!data || data.code !== 0) {
            dfd.reject(null);
        }
        else {

            if (data.rel && data.rel.contacts) {
                createIdFromJid(data.rel.contacts);
            }

            if (config.debug) {
                // 模拟延迟
                setTimeout(function () {
                    dfd.resolve(data.rel);
                }, 100);
            }
            else {
                dfd.resolve(data.rel);
            }
        }
    });
    /* eslint-enable */

    return dfd;
};

/**
 * 获取公共数据 - 指定人员信息
 *
 * @param {Array} jids, id 数组
 * @param {string} cid, cid 公司id ，可以不传
 * @param {number} dataFlag, 获取数据内容的标识
 * @return {Deferred}
 *
 */
middleware.getUserInfo = function (jids, cid, dataFlag) {
    var me = this;
    var dfd = new $.Deferred();

    // 如果没有dataFlag，dataFlag默认值为0
    dataFlag = dataFlag || 0;

    if (!jids || jids.length <= 0) {
        dfd.reject(null);
        return dfd;
    }

    if (!$.isArray(jids)) {
        jids = jids.split(',');
    }

    var jidArr = [];

    // 按原生需求拼接字符串
    jids.forEach(function (item) {
        jidArr.push(me.makeJid(item, cid));
    });

    if (dataFlag !== undefined) {
        dataFlag = parseInt(dataFlag, 10);

        if (isNaN(dataFlag)) {
            dataFlag = 0;
        }
    }

    var options = {
        action: 'pubdata/userInfo',
        parameter: {
            jids: jidArr,
            dataFlag: dataFlag
        }
    };

    return this.getPubData(options);
};

/**
 * 获取公共数据 - 指定人员头像，简直有点坑啊，要一次次的请求
 *
 * @param {Array} jids, id 数组
 * @param {string} cid, cid 公司id ，可以不传
 * @return {Deferred}
 *
 */
middleware.getUserIcon = function (jids, cid) {
    var dfd = new $.Deferred();
    var me = this;
    var arr = jids;

    if (!$.isArray(jids)) {
        arr = jids.split(',');
    }

    // promise 队列
    var promiseList = [];

    arr.forEach(function (id) {
        var jid = me.makeJid(id, cid);

        if (jid !== null) {

            var fn = me.getPubData({
                action: 'pubdata/contactIcon',
                parameter: {
                    jid: jid,
                    isUpdate: 0
                }
            });

            promiseList.push(fn);
        }
    });

    $.when.apply($, promiseList)
        .done(function () {
            // 获取整个promise 的返回
            var arr = Array.prototype.slice.call(arguments);

            dfd.resolve(arr);
        })
        .fail(function () {
            dfd.reject(null);
        });

    return dfd;
};


/**
 * 获取用户信息 以及 用户头像
 * 这里是为了避免常用请求，所以把 Fn * n + 1 次调用合并为 一次 Fn 已方便使用
 * 请求 userInfo 1 次请求，contactIcon 需要 N * count 次请求，所以一个用户列表 需要 N * count + 1 次
 *
 * @param {Array} jids, id 数组
 * @param {string} cid, cid 公司id ，可以不传
 * @return {Deferred}
 *
 */
middleware.getUserAndPhoto = function (jids, cid) {
    var me = this;
    var dfd = new $.Deferred();

    if (!jids || jids.length <= 0) {
        dfd.reject(null);
        return dfd;
    }

    var promiseList = [this.getUserInfo(jids, cid), this.getUserIcon(jids, cid)];

    $.when.apply($, promiseList)
        .done(function (userInfo, userIcon) {

            var userInfoArr = userInfo.contacts;

            var data = me.mergeObject2Array(userInfoArr, userIcon, 'jid');

            dfd.resolve(data);
        })
        .fail(function () {
            dfd.reject(null);
        });

    return dfd;
};

module.exports = middleware;
