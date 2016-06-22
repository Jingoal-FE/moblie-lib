/**
 * @file navigation.js
 * @author deo
 *
 * navigation 封装原生
 */

/* eslint-disable */
var navigation = {};
var util = require('common/util');
var lang = require('common/lang').getData();

/**
 * 获取 url 参数中的 referer
 *
 * @return {string}
 */
function getUrlReferer() {
    var referer = util.getParam('referer');
    return referer ? decodeURIComponent(referer) : null;
}

/**
 * 处理 Url 上的 referer
 *
 * @param {string} url, url
 * @param {boolean} keep, 是否丢弃 url 上的 referer
 * @return {string}
 */
function formatUrlReferer(url, keep) {
    var referer = getUrlReferer();

    var arr = url.split('?');
    var path = arr[0];
    var params;

    if (arr && arr.length === 2) {
        params = arr[1];

        try {
            params = util.qs.parse(params);
            
            // 要保持 referer
            if (keep && params) {

                if (!params.referer) {
                    params.referer = referer;
                }
                else {
                    delete params.referer;
                }
            }
        }
        catch (ex) {
            params = arr[1];
        }

        return path + '?' + util.qs.stringify(params);
    }

    return url;
}

/**
 * url 后面添加 referer
 *
 * @param {string} url, url
 * @param {string} referer, 添加 referer
 * @return {string}
 */
function addReferer(url, referer) {

    var arr = url.split('?');
    var path = arr[0];

    if (arr && arr.length === 2) {
        var params = arr[1];

        try {
            params = util.qs.parse(params);
            
            params.referer = referer;
        }
        catch (ex) {}

        return path + '?' + util.qs.stringify(params);
    }

    return path + '?referer=' + encodeURIComponent(referer);
}

var openTimerId = null;

/**
 * 要跳转的 url, 同时兼容 CPNavigationBar.redirect && CPNavigationBar.returnPreviousPage
 *
 * open(-1, {keep: true})
 *  自动判断是否 url params 是否有 referer，如果有则使用 referer 跳转
 *  如果 referer=true 则表示需要继续在 url 上带上 referer
 *
 * open(url)
 *  调用原生的跳转
 */
navigation.open = function (url, options) {

    var opts = {
        // 是否需要继续在 url 上继续跟上 referer
        // keep: false,

        // 指定 referer
        // referer: null,

        // 下一个页面的 title
        title: '',

        // 是否隐藏下一个页面的标题横条
        barHidden: false,
        // navigationBarHidden: false,

        // 回传
        returnParams: null,
        // pageReturnParam: null

        // setPreviousPageReturnStringData
        goBackParams: null,

        // 页面跳转参数，transFlag 页面过渡动画方式，isClosePage 是否关闭页面
        transitionParam: null
    };

    $.extend(opts, options);

    // url params 的 referer
    // var urlReferer = getUrlReferer();

    // Goback
    // 这个情况下，如果没有 referer，title 传递了也不会使用
    if (url === -1) {

        // 可爱的 PM 说：这个功能不要了
        // 如果有 referer 则直接跳转到指定页面
        // if (urlReferer) {
        //     // 使用跳转 url
        //     try {
        //         url = formatUrlReferer(urlReferer, opts.keep);
        //     }
        //     catch (ex) {
        //         CPNavigationBar.redirect('/');
        //     }

        //     CPNavigationBar.redirect(url, opts.title, opts.barHidden, opts.returnParams);
        // }
        // else {
        //     CPNavigationBar.returnPreviousPage();
        // }

        // 传递参数给上一个页面
        if (opts.goBackParams) {

            // 只执行一次点击
            if (openTimerId) {
                return;
            }

            CPNavigationBar.setPreviousPageReturnStringData(opts.goBackParams);

            openTimerId = setTimeout(function() {
                CPNavigationBar.returnPreviousPage();
            }, 500);
        }
        // 正常的返回
        else {
            CPNavigationBar.returnPreviousPage();
        }
    }

    else {
        // url 上继续跟上 referer
        // if (opts.keep && !opts.referer) {
        //     opts.referer = urlReferer;
        // }

        // 指定 referer
        // if (opts.referer) {
        //     url = addReferer(url, opts.referer);
        // }

        // 跳转
        CPNavigationBar.redirect(url, opts.title, opts.barHidden, opts.returnParams, opts.transitionParam);
    }
};

/**
 * 设置左侧导航
 */
navigation.left = function (options) {

    var opts = {
        icon: '',
        title: '',
        click: null
    };

    $.extend(opts, options);

    CPNavigationBar.setLeftButton({
        iconPath: opts.icon,
        title: opts.title,
        callback: opts.click
    });
};

/**
 * 设置右侧导航
 */
navigation.right = function (buttonArray) {

    if (!buttonArray) {
        return;
    }

    var icon = '';
    var arr = [];

    buttonArray.forEach(function (item) {

        if (typeof item === 'string') {
            icon = item;
        }
        else {
            arr.push({
                title: item.title || '',
                iconPath: item.icon || '',
                callback: item.click
            });
        }
    });

    // 如果没有下拉菜单，则 return
    if (arr.length === 0) {
        return;
    }

    // 如果只有一个下拉，则不需要菜单 icon，同时 icon 使用 第一个下拉的 icon 或者 title
    if (arr.length === 1) {
        icon = (arr[0].iconPath || arr[0].title);
    }

    CPNavigationBar.setRightButton(icon, arr);
};

navigation.clearRight = function () {
    CPNavigationBar.setRightButton('', []);
};

navigation.title = function (title) {
    CPNavigationBar.setTitle(title);
};

navigation.button = function (dir, enable) {
    CPNavigationBar.setButtonEnable(dir, enable);
};

/**
 * 检查必填内容是否输入完整
 */
var setButtonEnable = function ($required) {
    var enable = true;

    $required.each(function () {
        var $item = $(this);
        var txt = '';
        if ($item.is('textarea') || $item.is('input')) {
            txt = $item.val();
        }
        else {
            txt = $item.text();
        }

        if (txt.length === 0) {
            enable = false;
        }
    });

    navigation.button('right', enable);
};

navigation.buttonAutoEnable = function () {

    var $required = $('[required]');

    // 设置默认状态
    setButtonEnable($required);

    // 监听输入
    $required.on('input', function () {
        setButtonEnable($required);
    });
};

module.exports = navigation;
