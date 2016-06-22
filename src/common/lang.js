/**
 * @file lang.js
 * @author deo
 *
 * 语言包主函数, 该函数需要 language/index.js 作为配置入口
 * 根据 language/index.js 中的返回做成将要使用的 object
 * ---------注意---------
 * 1. 默认会在 page.js 中把 lang 数据添加到 data 对象节点上，由模版引擎通过模版数据直接负责语言包输出 [推荐]
 *      <script type='x-tmpl-mustache'>
 *          <div>{{ lang.key }}</div>
 *      ...
 *
 * 2. 如果有语言包是在非 <script type='x-tmpl-mustache'> 的普通节点上，则会调用 parseDOM 来完成语言包输出
 *      <div data-lang='langKey'></dt>
 *
 * 3. 默认情况下，view.js 的 render 之后 会自动调用 parseDOM
 */

var util = require('./util');
var langMap = require('./language/index');
var defaultLang = require('./language/zh_CN');

var Lang = function () {

    // 是否获取语言包失败
    this.failed = false;

    // 语言包类型
    this.type = util.getParam('lang');

    // 语言包数据
    this.data = null;

    var data = langMap[this.type];

    if (!data) {
        this.data = defaultLang;
        this.failed = true;
    }
    else {
        this.data = data;
    }
};

var valueArr = ['textarea', 'input'];

Lang.prototype = {

    getType: function () {
        return this.type;
    },

    isFailed: function () {
        return this.failed;
    },

    /**
     * 获取 语言包 数据
     *
     * @param {string} key [options], 指定获取某语言包数据
     * @return {Object}
     */
    getData: function (key) {

        if (!key) {
            return this.data;
        }

        return this.data[key] || '';
    },

    /**
     * 判断是否是输入类型的 dom
     *
     * @param {Element} $elem, 元素
     * @return {boolean}
     */
    valueDOM: function ($elem) {

        for (var i = 0; i < valueArr.length; i++) {
            var type = valueArr[i];

            if ($elem.is(type)) {
                return true;
            }
        }

        return false;
    },

    /**
     * 将 dom 节点上的 语言包替换到指定位置
     */
    parseDOM: function () {
        var me = this;

        try {
            var $elems = $('[data-lang]');

            if ($elems.length <= 0) {
                return;
            }

            $elems.each(function () {
                var $elem = $(this);

                if ($elem.attr('nodeType') === 1) {
                    var langKey = $elem.data('lang');
                    var value = me.getData(langKey);

                    if (me.valueDOM($elem)) {
                        $elem.val(value);
                    }
                    else {
                        $elem.html(value);
                    }
                }
            });
        }
        catch (ex) {}
    }
};

module.exports = new Lang();
