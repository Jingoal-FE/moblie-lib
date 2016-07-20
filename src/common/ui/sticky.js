/**
 * @file sticky 组件
 * @author deo
 */

var util = require('common/util');

var isSupportSticky = util.featureTest('position', 'sticky');

/**
 * 默认参数表
 * @type {Object}
 */
var DEFAULT_OPTS = {
    // 需要fixed的元素
    target: null,
    // 距离容器的位置
    top: 0,
    zIndex: 100,
    // 始终保持在顶部，这个可应用于特殊场景
    stayAlong: false
};

function Sticky(opts) {
    this.opts = $.extend({}, DEFAULT_OPTS, opts || {});

    this.$target = $(this.opts.target);

    if (!this.$target.length) {
        /* eslint-disable no-console */
        console.warn('Sticky: 元素不存在');
        /* eslint-enable no-console */
        return;
    }

    this.zIndex = this.opts.zIndex;
    this.top = this.opts.top;
    this.$body = $(document.body);
    this.$container = this.$target.parent();

    this.init();
}

Sticky.prototype = {

    init: function () {

        // 保存原始属性
        this.oldCss = this.$target.css(['position', 'top', 'z-index']);
        // 设置粘性属性
        this.newCss = {
            position: 'fixed',
            top: this.top + 'px',
            zIndex: this.zIndex
        };

        // 如果支持，则直接使用 sticky 特性
        if (isSupportSticky) {
            this.$target.css({
                position: '-webkit-sticky',
                top: this.top + 'px',
                zIndex: this.zIndex
            });

            // 不推荐使用
            if (this.opts.stayAlong) {
                $(document).off('scroll').on('scroll', $.proxy(this.webkitStayAlong, this));
                $(window).off('scroll').one('scroll', $.proxy(this.webkitStayAlong, this));
            }
        }

        // 根据滚动，实时判断位置
        else {
            this.$placeholder = $('<div></div>');
            this.$placeholder.css({
                width: this.$target.width(),
                height: this.$target.height()
            });
            this.$target.wrapAll(this.$placeholder);

            this.refreshParams();
            this.process();

            // 修改下，把scroll事件绑定到document上，否则在pc上监听不到滚动
            $(document).off('scroll').on('scroll', $.proxy(this.process, this));
            // window.scrollTo()第一次进来不会触发绑定在document上的scroll事件。。。
            $(window).off('scroll').one('scroll', $.proxy(this.process, this));
        }
    },

    /**
     * 非 webkit
     */
    refreshParams: function () {
        this.containerOffset = this.$container.offset();
        if (this.$placeholder && this.$placeholder.length) {
            this.targetOffset = this.$placeholder.offset();
        }
        this.clientHeight = this.$body.height();
    },

    /**
     * 非 webkit
     */
    process: function () {
        var containerOffset = this.containerOffset;
        var targetOffset = this.targetOffset;

        if (this.clientHeight !== this.$body.height()) {
            this.refreshParams();
        }
        // 是否超过容器底部
        var layoutBottom = containerOffset.top - this.top + containerOffset.height - targetOffset.height;
        var isOutLayoutBottom = layoutBottom < window.scrollY;

        if (window.scrollY > targetOffset.top - this.top && (this.opts.stayAlong || !isOutLayoutBottom)) {
            this.fixed();
        }
        else {
            this.unfixed();
        }
    },

    /**
     * 非 webkit
     */
    fixed: function () {
        if (!this.isFixed) {
            this.$target.css(this.newCss);
            this.isFixed = true;
            this.$target.addClass('sticky-element');
        }
    },

    /**
     * 非 webkit
     */
    unfixed: function () {
        if (this.isFixed) {
            this.$target.css(this.oldCss);
            this.isFixed = false;
            this.$target.removeClass('sticky-element');
        }
    },

    /**
     * -webkit-sticky 特性下，依旧需要把当前的元素一直保持在某位置
     * 并不建议使用，该效果在边界处有一次轻微小抖动，体验为达到最佳
     */
    webkitStayAlong: function () {
        var containerOffset = this.$container.offset();
        var targetOffset = this.$target.offset();
        var layoutBottom = containerOffset.top - this.top + containerOffset.height - targetOffset.height;
        var isOutLayoutBottom = layoutBottom < window.scrollY;

        if (isOutLayoutBottom) {
            this.$container.css({
                position: 'absolute'
            });

            this.$target.css({
                position: 'fixed',
                top: 0
            });
        }
        else {
            this.$container.css({
                position: 'static'
            });
            this.$target.css({
                position: '-webkit-sticky',
                top: 0
            });
        }
    }
};

module.exports = Sticky;
