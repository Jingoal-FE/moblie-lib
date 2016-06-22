/**
 * @file pharos.js
 * @author deo
 *
 * 延后加载，为了 避免 请求数据时间过长，将一些非必须数据放在 dom ready 之后
 * 为了方便，我蛋疼的写了一个 伪模版loader, 免去在业务逻辑中去写 js 逻辑
 *
 * {
 *  list: [{name: 'director', num: '', ...}, {name: '', ...}],
 *  lang: {a: 'text'},
 *  num: 12
 * }
 * eg1: <dom loader="{#list.name:director}{num}{/list.name}"
 *      -> 匹配到 name = director 则进入判断条件
 * eg2: <dom loader="{lang.a}", <dom loader="{#lang}{a}{/lang}"
 * eg3: <dom loader="{num}"
 */

/* eslint-disable */

var util = require('common/util');

var Pharos = function (selector, data) {

    this.$wrapper = $(selector);
    this.data = data;

    this.init();

    this.render();
};

Pharos.prototype = {

    /**
     * 正则
     */
    expr: {
        check: /({[\w|:|#|\.]+})/g,
        isSample: /^{(.+)}$/
    },

    length: 0,

    queue: {},

    init: function () {

        var me = this;

        this.$wrapper.find('[loader]').each(function(i, item) {
            var $item = $(item);
            var guid = util.guid();
            $item.data('guid', guid);
            me.set(guid, $item[0]);
        });
    },

    /**
     * 设置数据
     *
     * @param {string} guid, guid
     * @param {Element} target, 数据源的元素
     */
    set: function (guid, target) {
        var $item = $(target);
        var loader = $item.attr('loader');

        if (!loader || loader.length <= 0) {
            return;
        }

        if (this.queue[guid] === undefined) {
            this.queue[guid] = {};
        }

        var isSample = this.expr.isSample.test(loader);
        var tpl = loader;
        var start = null;
        var end = null;

        if (!isSample) {
            var startIdx = tpl.indexOf('{');
            var endIdx = tpl.lastIndexOf('}') + 1;
            start = tpl.substring(0, startIdx);
            end = tpl.substring(endIdx, tpl.length);
            tpl = tpl.substring(startIdx, endIdx);
        }

        this.queue[guid] = {
            guid: guid,
            target: target,
            tpl: tpl,
            start: start,
            end: end
        };

        this.length ++;
    },

    /**
     * 获取指定数据
     *
     * @param {string} guid, guid
     * @return {Object}
     */
    get: function (guid) {
        return this.queue[guid] || null;
    },

    /**
     * 渲染数据
     */
    render: function () {
        var me = this;

        for (var guid in me.queue) {

            if (me.queue.hasOwnProperty(guid)) {

                var q = me.get(guid);
                var htmlstr = me.exec(q);

                if (htmlstr && htmlstr.length > 0) {

                    htmlstr = (q.start ? q.start : '') + htmlstr.join('') + (q.end ? q.end : '');

                    $(q.target)
                        .html(htmlstr)
                        .removeClass('hide');
                }
            }
        }
    },

    /**
     * 设置数据入口
     *
     * @param {Object} data, 数据源
     * @return {Array} 返回 maker 获取的 html array
     */
    exec: function (data) {
        var me = this;
        var arr = [];

        if (arr = data.tpl.split(me.expr.check)) {
            arr = me.trim(arr);

            return me.maker(arr);
        }

        return arr;
    },

    /**
     * 造数据
     *
     * @param {Array} arr, arr
     * @param {Array} 模版数据
     */
    maker: function (arr) {
        var me = this;
        var r = [];

        var obj = {
            params: []
        };

        var temp = arr;

        // if
        if (arr.length >= 3) {
            obj.start = temp[0].replace(/^{#/, '').replace(/}$/, '');
            obj.end = temp[temp.length - 1];

            temp.splice(0, 1);
            temp.splice(temp.length - 1, 1);
        }

        temp.forEach(function (param) {
            obj.params.push(
                param.replace(/^{/, '').replace(/}$/, '')
            );
        });

        // if enter
        if (obj.start) {
            var startArr = obj.start.split('.');
            var dataKey = startArr[0];
            var myData = me.data[dataKey];

            // 数据为数组类型
            if ($.isArray(myData) && startArr.length === 2) {

                var itemArr = startArr[1].split(':');
                var itemKey = itemArr[0];
                var itemValue = itemArr[1];

                myData.forEach(function (data) {

                    if (data[itemKey] === itemValue) {
                        r = me.getHtmlData(data, obj.params);
                    }
                });
            }
            // 数据为对象类型
            else {
                for (var k in myData) {
                    if (myData.hasOwnProperty(k)) {
                        r = me.getHtmlData(myData, obj.params);
                    }
                }
            }
        }
        // value enter
        else {

            obj.params.forEach(function (item) {
                var itemArr = item.split('.');
                
                var itemKey = itemArr[0];

                if (itemArr.length > 1) {

                    var data;

                    if (data = me.data[itemKey]) {
                        r.push(data[itemArr[1]]);
                    }
                }
                else {
                    r.push(me.data[itemKey]);
                }
            });
        }

        return r;
    },

    /**
     * 去除空数组
     *
     * @param {Array} arr, 数组
     * @return {Array}
     */
    trim: function (arr) {
        var temp = [];

        arr.forEach(function (item) {
            if (item.length > 0) {
                temp.push(item);
            }
        });

        return temp;
    },

    /**
     * 获取模版数据
     *
     * @param {Object} data, 本身的 data 对象
     * @param {Array} keys, data 下的 键数组
     * @return {Array}
     */
    getHtmlData: function (data, keys) {
        var arr = [];

        keys.forEach(function (key) {
            var v;
            if (v = data[key]) {
                arr.push(v);
            }
        });

        return arr;
    }
};

module.exports = Pharos;
