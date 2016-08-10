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

    this.opts = this.getOptions(options);

    /**
     * 移动标记，touchmove 会设置为 true
     */
    this.isMove = false;

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

    /**
     * 判断tab 的总数的大小 是否超过了屏幕宽度
     */
    this.isTabExceed = false;

    this.momentumTimeStart = 0;
    this.momentumTimeEnd = 0;

    this.init();
}

$.extend(Tab.prototype, Control.prototype);

$.extend(Tab.prototype, {

    getOptions: function (options) {

        return $.extend({

            /**
             * Main
             */
            main: null,

            /**
             * 拖动的时候允许超过边界的最大值
             */
            dragMax: 80,

            /**
             * 可视区域完整的个数
             */
            viewNum: 3,

            /**
             * 激活状态的tab class
             */
            activeClass: 'tab-active',

            /**
             * 默认激活的 索引 tab
             */
            activeIndex: 0

        }, options || {});
    },

    init: function () {

        this.$main = $(this.opts.main);
        this.$ul = this.$main.find('ul');
        this.$window = $(window);

        this.$ul.css({
            zIndex: 99
        });

        // 先设置好 tab ul 的 translate
        this.$ul[0].style[util.prefixStyle('transform')] = 'translate3d(0px, 0px, 0px)';

        this.fixTabSize();

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
    fixTabSize: function () {
        var winWidth = this.$window.width();

        this.$main.css({
            width: winWidth
        });

        var $li = this.$main.find('li');

        // 重新修正每一个的宽度，用于保证始终能漏出半个 tab 可视区域的最右侧位置
        var fixSize = Math.floor(winWidth / (this.opts.viewNum + .5));

        // 这里再次做一次判断，如果修正后的 tab 总宽度小于屏幕宽度，则需要重新计算
        // 同时这里需要禁用一些不需要的功能
        if (fixSize * $li.length <= winWidth) {
            fixSize = winWidth / $li.length;
            this.isTabExceed = false;
        }
        else {
            this.isTabExceed = true;
        }

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

            if (me.isTabExceed) {
                me.clickFix2View(this);
            }

            $(this)
                .addClass(me.opts.activeClass)
                .siblings().removeClass(me.opts.activeClass);

            // 触发自定义事件
            me.fire.call(me, 'click', this);
        });

        me.$ul.on('touchstart', function (event) {

            if (me.isTabExceed) {
                var touch = event.touches[0];

                // 起始坐标，上次拖动的距离
                me.originX = me.diffX;

                // 拖动的起点
                me.startX = touch.pageX;

                me.momentumTimeStart = +new Date();
                me.momentumTimeEnd = 0;

                me.isMove = false;
            }
        });

        me.$ul.on('touchmove', function (event) {
            event.preventDefault();

            if (me.isTabExceed) {

                // 设置移动标记
                me.isMove = true;

                var touch = event.touches[0];

                // 移动距离
                me.diffX = me.originX + touch.pageX - me.startX;

                // 获取方向
                me.dir = touch.pageX - me.startX < 0 ? -1 : 1;

                me.touchMove();
            }
        });

        me.$ul.on('touchend', function (event) {

            // 进行了 touchmove 以及 tab 超过屏幕
            if (me.isMove && me.isTabExceed) {

                me.momentumTimeEnd = +new Date();

                me.touchBack();

                me.momentum();
            }
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

        this.tabSlide(this.diffX, '');
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
            this.tabSlide(step, util.prefixStyle('transform') + ' 400ms cubic-bezier(.58,.59,.51,.83)');

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

        this.tabSlide(this.fixTo);
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

            this.tabSlide(moveTo);
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
     * Tab 动画入口
     *
     * @param {number} dis, 移动距离
     * @param {string} trans, transition 字符串配置
     */
    tabSlide: function (dis, trans) {
        this.animate3d(this.$ul[0], dis + 'px', trans);
    },

    /**
     * 动画函数
     *
     * @param {Element} targetElement, 进行动画的元素
     * @param {string} dis, 移动距离, eg: 100px, 50%
     * @param {string} trans, transition 字符串配置
     */
    animate3d: function (targetElement, dis, trans) {
        var transform = util.prefixStyle('transform');
        var transition = util.prefixStyle('transition');

        targetElement.style[transform] = 'translate3d(' + dis + ', 0px, 0px)';

        if (trans !== undefined) {
            targetElement.style[transition] = trans;
        }
        else {
            targetElement.style[transition] = transform + ' 260ms cubic-bezier(.48, .14, .41, .97)';
        }
    }
});

module.exports = Tab;
