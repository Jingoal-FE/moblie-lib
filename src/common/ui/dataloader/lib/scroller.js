/**
 * @file scroller.js
 * @author deo
 *
 * 用于 dataloader.js 处理滚动事务
 */
var CONST = require('./const');
var template = require('./template');
var IScroll = require('dep/iscroll');
var util = require('common/util');

function Scroller() {

    /**
     * 等待绑定滚动实例
     *
     * @param {boolean}
     */
    this.scroll = null;

    /**
     * 刷新动作完成标记
     *
     * @param {boolean}
     */
    this._refreshDone = true;

    /**
     * 当前要发送请求的类型 refresh, more
     *
     * @param {string}
     */
    this._type = null;

    /**
     * 拖动的方向
     * -1 往上
     * 1 往下
     *
     * @param {number}
     */
    this._dir = 0;

    /**
     * 是否进入加载范围
     *
     * @param {boolean}
     */
    this._inRange = null;

    /**
     * 是否滚动结束
     *
     * @param {boolean}
     */
    this._scrollEnd = true;

    this._scrollBackTimerId = null;
    this._scrollBackDone = null;
    // scroll end 之后的位置修正
    this._fixedTimerId = null;

}

Scroller.prototype = {

    /**
     * 滚动加载初始化
     */
    scrollInit: function () {

        var iscrollWrapper = 'data-loader-iscroll-wrapper';

        // IScroll 必须要在实际滚动的容器外部包裹一个，为了不影响本身的结构，自动添加一个 div 包裹实际的 $main
        // 'refresh' & more 2个 加载条与该容器同级
        this.$main.wrap('<div class="' + iscrollWrapper + '"></div>');

        var $scroll = this.$wrapper.find('.' + iscrollWrapper);

        // 外部容器的基础设置
        this.$wrapper.css({
            height: this.opts.height,
            position: 'relative',
            overflow: 'hidden'
        });

        // 添加 刷新条
        this.$main.before(
            this.$refresh = $(template.getRefreshHtml())
        );

        this.refreshHeight = this.$refresh.height();

        // 绑定 iscroll 功能
        this.scroll = new IScroll(this.$wrapper[0], {

            // 为了较为准确的加载数据，这里需要设置为 3
            probeType: 3,
            scrollX: false,
            scrollY: true,
            scrollbars: false,
            click: true,

            // 禁用监听鼠标和指针
            disableMouse: true,
            disablePointer: true,

            mouseWheel: false,

            // 快速触屏的势能缓冲开关
            // 苹果打开势能
            momentum: util.isApple()
        });

        this.bindScrollEvents();
    },

    /**
     * 绑定滚动的监听事件
     */
    bindScrollEvents: function () {
        var me = this;

        // 这里做加载的判断
        me.scroll.on('scroll', function () {
            var target = this;

            // 设置当前滚动的方向
            // -1 代表 上拉
            if (me._startY - target.y < 0) {
                me._dir = -1;
            }
            // 1 代表 下拉
            else {
                me._dir = 1;
            }

            // 关键位置，非常非常
            // 下拉刷新的时候，将顶部定在下拉刷新条的位置
            if (!me._refreshDone && target.y < me.refreshHeight && me._type === CONST.REFRESH) {
                me.scroll.scrollTo(0, me.refreshHeight);
            }

            // 数据没有请求的时候才做检测
            if (!me._process) {

                // 下拉刷新判断
                me.checkRefresh(target);

                // 加载更多判断
                me.checkMore(target);
            }
        });

        // 监听滚动开始
        me.scroll.on('scrollStart', function () {
            me._type = null;

            // scroll end 标记
            me._scrollEnd = false;

            // 用于记录方向
            me._startY = this.y;
        });

        // 监听滚动结束
        me.scroll.on('scrollEnd', function () {
            var target = this;

            // 关键位置：如果为下拉刷新，同时 scroll 监听中进入 scrollTo 的判断条件
            // 下拉刷新的情况，滚动结束之后把顶部定位到 下拉条位置，等待后续动画
            if (me._type === CONST.REFRESH) {
                me.refreshBackListener();
            }

            me._scrollEnd = true;
        });

        // 鼠标放开的时候判断是否需要刷新
        $(document)
            .off('touchend.dataloader')
            .on('touchend.dataloader', function () {

                // 这里存储一个变量，me._type 可能在回调之前就已经被清空
                var type = me._type;

                // 如果没有上拉加载功能被禁用，则不发送该请求
                if (type === CONST.MORE && me._moreDisable) {
                    return;
                }

                if (type !== null && me._inRange) {

                    // 标记下拉刷新整个逻辑未完成
                    if (type === CONST.REFRESH) {
                        me._refreshDone = false;
                    }

                    me.send(type)
                        .done(function (data) {
                            // 下拉刷新 加载成功 回调
                            me.fireSuccess(type, data);

                            // 回滚动画完成之后 触发 iscroll 刷新
                            if (type === CONST.REFRESH) {
                                me.refreshBackListener();
                            }
                            // 上拉加载更多
                            else {
                                me.scroll && me.scroll.refresh();
                                me.resetStatus();
                            }
                        })
                        .fail(function () {
                            // 失败
                            me.fireFailed();
                        })
                        .always(function () {});
                }
            });

        // 下拉刷新返回动画结束之后
        me.on(CONST.EVENT_REFRESH_BACK, function () {
            me.scroll && me.scroll.refresh();
        });
    },

    /**
     * 数据加载完成之后，才执行下拉刷新的 返回动画
     * 此处会被 scrollEnd 以及 touchend 触发
     */
    refreshBackListener: function () {

        // 关键位置：固定在 刷新条
        if (this._refreshDone === false) {
            this.scroll.scrollTo(0, this.refreshHeight);
        }

        // _scrollEnd: iscroll end 滚动完成
        // _process: 数据加载完成
        // _refreshDone: 触发了 下拉刷新动作
        if (this._refreshDone === false && this._scrollEnd === true && this._process === false) {
            this.refreshScrollBack();
        }
    },

    /**
     * 下拉刷新的返回动画
     */
    refreshScrollBack: function (type) {
        var me = this;
        var delayScroll = 120;
        var delayBack = 200;

        clearTimeout(me._scrollBackTimerId);

        me._scrollBackTimerId = setTimeout(function () {
            clearTimeout(me._scrollBackDone);

            // 成功的返回动画
            me.scroll.scrollTo(0, 0, delayScroll);

            // 重置状态文字
            me.refreshUpdate(CONST.DEFAULT);

            me.resetStatus();

            me._scrollBackDone = setTimeout(function () {
                // 返回完成之后 触发 下拉刷新
                // 传递 一个 刷新类型
                me.fire(CONST.EVENT_REFRESH_BACK, CONST.REFRESH);
            }, delayScroll);

        }, delayBack);
    },

    resetStatus: function () {

        this._refreshDone = true;
        this._type = null;
        this._inRange = false;
    },

    /**
     * 检查是否允许刷新
     *
     * @param {iscroll} target, scroll
     */
    checkRefresh: function (target) {
        // 非下拉动作，不进行后面的操作
        if (this._dir !== -1 || this._refreshDisable) {
            return;
        }

        // 进入界定范围
        if (target.y > this.refreshHeight * 1.5) {
            this._inRange = true;
            this._type = CONST.REFRESH;
            
            this.refreshUpdate(CONST.HOLDER);
        }
        // 移出制定范围，只把 inRange 重置， _type 继续保留
        else {
            this._inRange = false;
            
            this.refreshUpdate(CONST.DEFAULT);
        }
    },

    /**
     * 检查是否允许加载更多
     *
     * @param {iscroll} target, scroll
     */
    checkMore: function (target) {
        // 非上拉动作，不进行后面的操作
        if (this._dir !== 1 || this._moreDisable) {
            return;
        }

        // 下方滑动出的距离
        var diff = target.maxScrollY - target.y;

        if (diff > this.moreHeight) {
            this._inRange = true;
            this._type = CONST.MORE;

            this.moreUpdate(CONST.HOLDER);
        }
        // 移出制定范围，只把 inRange 重置， _type 继续保留
        else {
            this._inRange = false;

            this.moreUpdate(CONST.DEFAULT);
        }
    }
};

module.exports = Scroller;
