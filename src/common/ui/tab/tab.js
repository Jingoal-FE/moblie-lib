/**
 * @file dataloader.js
 * @author deo
 *
 * 列表数据加载器
 */

var util = require('common/util');
var Control = require('common/control');

/**
 * Main Mai Ma M
 *
 * @param {Object} options, 配置项
 */
function Tab(options) {

    Control.call(this, options);

    this.opts = getOptions(options);

    /**
     * 移动值
     */
    this.diffX = 0;

    /**
     * 已经移动的距离
     */
    this.originX = 0;

    /**
     * diff 的计算对比值
     */
    this.startX = 0;

    /**
     * 右侧边界
     */
    this.moveMax = 0;

    /**
     * 拖拽释放返回的修正值
     */
    this.fixTo = null;

    this.momentumTimeStart = 0;
    this.momentumTimeEnd = 0;

    this.init();
}

$.extend(Tab.prototype, Control.prototype);

function getOptions(options) {

    return $.extend({

        /**
         * Main
         */
        main: null,

        /**
         * 拖动的时候允许超过边界的最大值
         */
        dragMax: 80,

        viewNum: 3,

        activeClass: 'tab-active',

        activeIndex: 0

    }, options || {});
}

$.extend(Tab.prototype, {

    init: function () {

        this.$main = $(this.opts.main);
        this.$ul = this.$main.find('ul');
        this.$window = $(window);

        this.$ul.css({
            'z-index': 999
        });

        this.$ul[0].style[util.prefixStyle('transform')] = 'translate3d(0px, 0px, 0px)';

        this.setLayout();

        this.setMoveMax();

        this.bindEvents();

        var $def = this.$ul.find('li').eq(this.opts.activeIndex);

        if ($def && $def.length) {
            $def.trigger('click');
        }
    },

    /**
     * 设置tab，使屏幕内部始终保持半个 tab 可见
     */
    setLayout: function () {

        this.$main.css({
            width: this.$window.width()
        });

        var $li = this.$main.find('li');

        // 重新修正每一个的宽度，用于保证始终能漏出半个 tab 可视区域的最右侧位置
        var fixSize = Math.floor(this.$window.width() / (this.opts.viewNum + .5));

        $li.css({
            width: fixSize
        });

        this.$ul.width(fixSize * $li.length);
    },

    /**
     * 可以移动的最大值
     */
    setMoveMax: function () {
        this.moveMax = this.$window.width() - this.$ul.width();
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
        var me = this;

        me.$ul.on('click', 'li', function () {
            me.clickFix2View(this);

            $(this)
                .addClass(me.opts.activeClass)
                .siblings().removeClass(me.opts.activeClass);

            // 触发自定义事件
            me.fire.call(me, 'click', this);
        });

        me.$ul.on('touchstart', function (event) {
            var touch = event.touches[0];

            // 起始坐标，上次拖动的距离
            me.originX = me.diffX;

            // 拖动的起点
            me.startX = touch.pageX;

            me.momentumTimeStart = +new Date();
        });

        me.$ul.on('touchmove', function (event) {
            event.preventDefault();

            var touch = event.touches[0];

            // 移动距离
            me.diffX = me.originX + touch.pageX - me.startX;

            // 获取方向
            me.dir = touch.pageX - me.startX < 0 ? -1 : 1;

            me.touchMove();
        });

        me.$ul.on('touchend', function (event) {
            // var touch = event.touches[0];

            me.momentumTimeEnd = +new Date();

            me.touchBack();

            me.momentum();
        });
    },

    /**
     * 拖拽移动
     */
    touchMove: function () {

        // 超过左边界
        if (this.diffX > 0) {
            this.fixTo = 0;

            // 拖动超过左侧最大拖动边界
            if (this.diffX > this.opts.dragMax) {
                return;
            }
        }

        // 超过右边界
        else if (this.diffX < this.moveMax) {
            this.fixTo = this.moveMax;

            // 拖动超过右侧最大拖动边界
            if (Math.abs(this.diffX) > Math.abs(this.moveMax) + this.opts.dragMax) {
                return;
            }
        }

        else {
            this.fixTo = null;
        }

        this.animate3d(this.diffX, '');
    },

    /**
     * touch 拖动结束后的势能缓冲
     */
    momentum: function () {

        // 如果是回弹修正，则不进行后面的操作
        if (this.fixTo !== null) {
            return;
        }

        var step = this.fixStep(this.diffX + Math.abs(this.diffX * .314) * this.dir);

        // Diff (ms)
        if (this.momentumTimeEnd - this.momentumTimeStart < 188) {
            this.animate3d(step, util.prefixStyle('transform') + ' 400ms cubic-bezier(.58,.59,.51,.83)');

            this.diffX = step;
        }
    },

    /**
     * touch 拖动tab 结束之后的回弹到正确位置
     */
    touchBack: function () {

        if (this.fixTo === null) {
            return;
        }

        this.diffX = this.fixTo;

        this.animate3d(this.fixTo);
    },

    /**
     * 点击的tab 的时候，如果点击的是边缘位置的 DOM，则把点击 DOM 尽可能的移动到屏幕中心
     *
     * @param {Element} target, 点击项
     */
    clickFix2View: function (target) {
        var $target = $(target);
        var offset = $target.offset();
        var max = offset.left + offset.width;

        if (max > this.$window.width() || offset.left < 0) {

            // 屏幕宽度的一半 - DEMO 左侧 + DEMO 宽度的一半
            var moveTo = this.$window.width() * .5 - (offset.left + offset.width * .5);

            // 这里添加上已经移动的起始位置
            moveTo = this.fixStep(this.originX + moveTo);

            // 这个移动终点值要保存在 diffX 上，因为在 touchstart 的时候是获取的 diff 赋值到的 origin 上
            this.diffX = moveTo;

            this.animate3d(moveTo);
        }
    },

    /**
     * 修正移动距离，不能超过左右边界
     *
     * @param {number} step, 移动距离
     * @return {number}
     */
    fixStep: function (step) {

        // 超过左侧边界
        if (step > 0) {
            return 0;
        }

        // 超过右侧边界
        if (Math.abs(step) > Math.abs(this.moveMax)) {
            return this.moveMax;
        }

        return step;
    },

    /**
     * 动画函数
     *
     * @param {number} dis, 移动距离
     * @param {string} trans, transition 字符串配置
     */
    animate3d: function (dis, trans) {
        var transform = util.prefixStyle('transform');
        var transition = util.prefixStyle('transition');

        this.$ul[0].style[transform] = 'translate3d(' + dis + 'px, 0px, 0px)';

        if (trans !== undefined) {
            this.$ul[0].style[transition] = trans;
        }
        else {
            this.$ul[0].style[transition] = transform + ' 260ms cubic-bezier(.48, .14, .41, .97)';
        }
    }
});

module.exports = Tab;
