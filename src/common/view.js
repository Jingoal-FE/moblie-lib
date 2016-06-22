/**
 * @file view.js
 * @author deo (denglingbo@126.com)
 *
 * 模板相关
 *
 */

var Mustache = require('dep/mustache');
// var lang = require('./lang');

/**
 * Mustache
 *
 */
var view = {};


/**
 * 获取模板数据
 *
 * @param {string} template, 模板
 * @param {Object} data, 数据
 * @param {Object} opts, 可选配置
 *      @param {Object} options.partials, 子模版配置 {tempName: 'html string'}
 * @return {string} html 片段
 *
 */
view.getHtml = function (template, data, opts) {
    var html = '';

    if (opts && opts.partials) {
        html = Mustache.to_html(template, data, opts.partials);
    }
    else {
        html = Mustache.render(template, data);
    }

    return html;
};

/**
 * Mustache 渲染模板
 * 模板输出 dom $(selector), 模板源: selector'-tmpl'
 *
 * @param {string} selector, #id|.class|tagname
 * @param {Object} data, 数据
 * @param {Object} options, 可选配置
 *      @param {Null|string} options.tmpl, script 内容 或者 模版字符串
 *      @param {string} options.type, dom 添加方式
 *      @param {Object} options.partials, 子模版配置 {tempName: 'html string'}
 * @return {string} html 片段
 *
 */
view.render = function (selector, data, options) {

    var opts = {
        // 如果 tmpl 为 null，会从当前页面上获取 selector[-tmpl] 的内容
        tmpl: null,
        type: 'html',
        // 子模版配置，{template name: 'template html string'}
        partials: null
    };

    $.extend(opts, options);

    var $elem = $(selector);

    if (!$elem.length) {
        return this.getHtml(opts.tmpl, data, opts);
    }

    if (!opts.tmpl) {
        var $temp = $($elem.selector + '-tmpl');
        var template = $temp.html();
    }
    else {
        template = opts.tmpl;
    }

    var html = this.getHtml(template, data, opts);

    $elem[opts.type](html);

    return html;
};


/**
 * 根据模板获取renderer函数
 *
 * @param {string} template 模板
 */
view.getRenderer = function (template) {
    Mustache.parse(template);
};

module.exports = view;
