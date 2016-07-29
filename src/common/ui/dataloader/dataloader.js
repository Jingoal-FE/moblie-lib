/**
 * @file dataloader.js
 * @author deo
 *
 * 列表数据加载器
 */

var CONST = require('./lib/const');
var template = require('./lib/template');

var Control = require('common/control');

var Scroller = require('./lib/scroller');

/**
 * Main Mai Ma M
 *
 * @param {Ojbect} options, 配置项
 */
function DataLoader(options) {

    /**
     * 获取 wrapper 节点下的 <div data-loader="content"> ... </div> 作为内容容器
     */
    options.main = options && $(options.wrapper).find('[data-loader=content]');

    // 该组件，因 iScroll && 上拉 下拉 2个 容器的位置原因，将 render 位置 指向 Control.main
    options.renderTo = options.main;

    Control.call(this, options);

    this.opts = getOptions(options);

    // 调用 Scroll
    if (this.isScrollModel()) {

        Scroller.call(this);

        // 下拉刷新 只有 滚动加载模式才有
        this.$refresh = null;
        this._refreshDisable = false;
    }

    /**
     * 设置一些基础配置
     */
    this.page = this.opts.page;

    /**
     * Ajax Promise
     */
    this.promise = this.opts.promise;

    this.$wrapper = $(this.opts.wrapper);
    this.$main = options.main;

    /**
     * 加载更多的 DOM
     */
    this.$more = null;

    /**
     * 请求发送的时间
     */
    this.reqStart = null;

    /**
     * 请求成功或者失败的时间
     */
    this.reqEnd = null;

    /**
     * 是否正在加载数据
     */
    this._process = false;

    /**
     * 加载更多是否被禁用
     */
    this._moreDisable = false;

    /**
     * 是否数据全部加载完毕
     */
    this._isAllLoaded = false;

    // Innnnnnit
    this.init();
}

$.extend(DataLoader.prototype, Control.prototype);

// 滚动处理逻辑
$.extend(DataLoader.prototype, Scroller.prototype);

function getOptions(options) {

    return $.extend({

        /**
         * 默认页数
         * @param {number}
         */
        page: 1,

        /**
         * 外层容器
         * @param {Element} #required
         */
        wrapper: null,

        /**
         * 该 tpl 根据后端数据进行渲染的模版，由 Control 进行负责操作
         * @param {string} #required
         */
        tpl: null,

        /**
         * 一定要在 function 内部 return $.ajax，不然一万年都不是新的请求
         * @param {Function} #required
         *
         * promise: function () {
         *     return page.ajax, page.get, page.post, $.ajax, ...
         * }
         */
        promise: null,

        /**
         * 每次请求后端会返回的 list 长度，默认为 10条，如果返回的 list.length 小于这个值，就认为没有新数据了
         * @param {number}
         */
        pagenum: 10,

        /**
         * 是否使用滚动加载方式
         * @param {boolean}
         */
        scrollModel: false,

        /**
         * 滚动模式下外层容器的高度，启动滚动模式 该值则为必填
         * @param {number}
         */
        height: $(window).height(),

        /**
         * 后端返回的数据 根节点
         * @param {string} result.data
         */
        dataRoot: 'data',

        /**
         * 数据列表
         * @param {string} result.{dataRoot}.list
         */
        // dataKey: 'list',

        /**
         * 总数据
         * @param {string} result.{dataRoot}.total
         */
        totalKey: 'total',

        /**
         * 语言包设置
         */
        lang: function () {
            // this.setMore({default: 'xx', ...});
            // this.setRefresh({process: 'yy', ...});
        },

        /**
         * 当数据为空的时候，自动隐藏加载更多
         * @param {boolean}
         */
        autoNullHide: false

    }, options);
}

$.extend(DataLoader.prototype, {

    /**
     * 滚动刷新机制
     *
     * @return {boolean}
     */
    isScrollModel: function () {
        return this.opts.scrollModel;
    },

    init: function () {
        var me = this;

        // 允许修改默认语言包
        me.opts.lang.call(template.lang);

        // 滚动刷新模式下，才初始化滚动事务
        if (me.isScrollModel()) {

            // By require('./scroller.js')
            me.scrollInit();
        }

        // 添加 加载更多
        var html = this.getControlHtml('dataloader-more', template.getMoreHtml());
        me.$main.after(
            me.$more = $(html)
        );

        me.moreHeight = me.$more.height();

        // 初次请求，使用 more 的接口
        me.requestMore(true);

        me.bindEvents();

        me.$wrapper.css({
            'z-index': 999
        });
    },

    /**
     * 获取 下拉刷新、上拉加载更多的 html 字符串
     *
     * @param {string} className, 外层容器的 class name
     * @param {string} childHtml, 子 DOM html 字符串
     * @return {string} html string
     */
    getControlHtml: function (className, childHtml) {

        if (this.$wrapper.find('.' + className).length) {
            this.$wrapper.find('.' + className).remove();
        }

        return '<div class="' + className + '">' + childHtml + '</div>';
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
        var me = this;

        me.$more.on('click', function () {
            me.requestMore();
        });
    },

    /**
     * 数据全部加载完毕
     *
     * @param {number} total, 总数
     * @return {boolean|null} false 代表未加载完所有数据, true 加载所有, null 无数据
     */
    isAllLoaded: function (total) {
        // 已经请求的总数据长度
        var curTotal = this.page * this.opts.pagenum;

        if (!total) {
            return null;
        }

        if (curTotal < total) {
            return false;
        }

        return true;
    },

    isNull: function () {
        return this._isAllLoaded === null;
    },

    onlyOnePage: function () {
        return this._isAllLoaded && this.page === 1;
    },

    /**
     * 改变状态接口
     *
     * @param {Object} obj, classes json
     * @param {string} key, 样式map 中的 某个key (default, process, ...)
     */
    statusUpdate: function (obj, key) {

        if (obj && obj[key]) {
            var $elem = $('.' + obj[key]);
            var $others = $elem.siblings();

            $others.addClass('hide');
            $elem.removeClass('hide');
        }
    },

    /**
     * 刷新条文字改变
     *
     * @param {string} key, 样式map 中的 某个key (default, process, ...)
     */
    refreshUpdate: function (key) {
        if (!key) {
            this.$refresh.addClass('hide');
            return;
        }

        this.$refresh.removeClass('hide');
        this.statusUpdate(template.refreshClass, key);
    },

    /**
     * 加载更多文字改变
     *
     * @param {string} key, 样式map 中的 某个key (default, process, ...)
     */
    moreUpdate: function (key) {
        if (!key) {
            this.$more.addClass('hide');
            return;
        }

        this.$more.removeClass('hide');
        this.statusUpdate(template.moreClass, key);
    },

    /**
     * 请求更多数据
     *
     * @param {boolean} isFirst, true or false
     */
    requestMore: function (isFirst) {
        var me = this;

        var dfd = me.send(CONST.MORE);

        if (!dfd) {
            return;
        }

        dfd
            .done(function (data) {
                // true: 第一次加载
                me.fireSuccess(CONST.MORE, data, isFirst);

                if (me.isScrollModel()) {
                    me.keepRefresh();
                }
            })
            .fail(function () {
                me.fireFail();
            });
    },

    /**
     * 请求数据接口 逻辑
     *
     * @param {string} type, 'refresh' or 'more'
     * @return {Deferred|null}
     */
    send: function (type) {
        var me = this;

        // 刷新动作
        var isRefresh = (type === CONST.REFRESH);

        if (isRefresh) {
            me.page = 1;
        }

        // 非刷新操作 && 数据加载完毕，则不做后面的请求了
        if (!isRefresh && me._isAllLoaded) {
            return null;
        }

        type = type || CONST.MORE;

        var dfd = new $.Deferred();

        me.reqStart = +new Date();

        // 数据正在加载
        me._process = true;

        // 以备请求失败，把参数还原
        var storePage = me.page;
        var classObj = isRefresh ? template.refreshClass : template.moreClass;

        me.statusUpdate(classObj, CONST.PROCESS);

        me.promise()
            .done(function (result) {

                var data = result;

                // 使用后端返回的数据的某数据节点
                if (result && result[me.opts.dataRoot]) {
                    data = result[me.opts.dataRoot];
                }

                // 效验数据状态
                me._isAllLoaded = me.isAllLoaded(data[me.opts.totalKey]);
                var isNull = me.isNull();

                me.reqEnd = +new Date();

                // 不管成功失败，都把该标记还原
                me._process = false;

                // 为下次请求做准备
                me.page++;

                me.statusUpdate(classObj, CONST.DONE);

                // more 直接将状态文字改为默认
                if (!isRefresh) {
                    me.statusUpdate(classObj, CONST.DEFAULT);
                }

                // 下面处理一些非常态
                // refresh 处理逻辑, 启用上拉加载更多的判断条件
                // 数据没有全部加载完毕
                // 是否当前数据只有 一页 存在
                if (isRefresh && me._isAllLoaded === false && !me.onlyOnePage()) {
                    me._moreDisable = false;
                }

                // 全部加载完毕，处理逻辑
                if (me._isAllLoaded === true) {
                    me.moreUpdate(CONST.MAX);
                    me._moreDisable = true;

                    // 使用加载前的 pagenum
                    me.page = storePage;
                }

                // 无数据
                if (isNull) {
                    if (me.opts.autoNullHide) {
                        me.moreUpdate();
                    }
                    else {
                        me.moreUpdate(CONST.NULL);
                    }
                    me._moreDisable = true;

                    // 使用加载前的 pagenum
                    me.page = storePage;
                }

                // 有数据的情况，才返回 data
                dfd.resolve.call(me, isNull ? null : data);
            })
            .fail(function () {
                me.reqEnd = +new Date();

                // 不管成功失败，都把该标记还原
                me._process = false;

                me.page = storePage;

                dfd.reject.call(me, null);

                me.statusUpdate(classObj, CONST.FAIL);
            });

        return dfd;
    },

    /**
     * 请求成功 数据为空
     */
    fireNull: function () {
        this.fire.call(this, CONST.EVENT_NULL);
    },

    /**
     * 请求成功 触发自定义绑定的事件
     *
     * @param {string} type, 'refresh' or 'more'
     * @param {Object} data, 数据
     */
    fireSuccess: function (type, data) {
        this.fire.call(this, type, data);
    },

    /**
     * 请求失败 触发自定义绑定的事件
     */
    fireFail: function () {
        this.fire.call(this, CONST.EVENT_FAIL, null);
    }
});

module.exports = DataLoader;
