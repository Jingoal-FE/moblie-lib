/**
 * @file tab.slide.js
 * @author deo
 *
 * tab 菜单带对应内容滑动效果
 */

var util = require('common/util');
var Tab = require('./tab');

$.extend(Tab.prototype, {

    /**
     * 滑动功能的入口
     */
    slideInit: function (options) {

        var defOptions = {

            /**
             * 内容容器的外层 DOM
             */
            wrapper: null,

            /**
             * 内容容器
             */
            content: null,

            /**
             * 内容容器的实际滚动的最大屏幕数
             */
            screenMoveNum: 2,

            width: this.$window.width(),

            height: this.$window.height() - this.$main.height()
        };

        $.extend(defOptions, options);

        $.extend(this.opts, defOptions);

        this.$wrapper = $(this.opts.wrapper);
        this.$content = this.$wrapper.find(this.opts.content);

        /**
         * 当前的位置信息
         */
        this.currentDis = 0;

        this.contentInit();

        this.clickListener();
    },

    /**
     * 初始化内容容器
     */
    contentInit: function () {
        var me = this;

        // 对每一个tab 对应的内容容器做基础设置
        me.$content.each(function (i) {
            this._dis = i * me.opts.width;

            this.style[util.prefixStyle('transform')] = 'translate3d(' + this._dis + 'px, 0px, 0px)';

            $(this).css({
                position: 'absolute',
                width: '100%',
                left: 0,
                top: 0
            });
        });

        // 自动添加一个动画 DOM
        me.$slider = $('<div class="tab-content-slider"></div>');
        me.$slider.css({
            position: 'relative',
            width: me.opts.width * me.$content.length,
            height: me.opts.height,
            zIndex: 99
        });
        me.$content.wrapAll(me.$slider);

        // 设置外层容器
        me.$wrapper.css({
            overflow: 'hidden',
            width: me.opts.width
        });
    },

    /**
     * 监听 tab 点击
     */
    clickListener: function () {
        var me = this;

        this.on('click', function (event, target) {
            var key = $(target).attr('tab-key');
            var $clickContent = me.$slider.find('[tab-content="' + key + '"]');

            if ($clickContent && $clickContent.length) {
                me.contentSlide($clickContent);
            }
        });
    },

    /**
     * 内容容器进行滑动展示
     */
    contentSlide: function ($clickContent) {
        var dis = $clickContent[0]._dis;
        var slider = this.$slider[0];

        // 要滚动的屏幕数量
        var screenNum = Math.abs(Math.round((dis - this.currentDis) / this.opts.width));

        if (screenNum > this.opts.screenMoveNum) {
            var fix3dLeft = Math.abs(dis - this.opts.screenMoveNum * this.opts.width) * -1;

            // @required
            slider.style[util.prefixStyle('transition')] = '';
            slider.style[util.prefixStyle('transform')] = 'translate3d(' + fix3dLeft + 'px, 0px, 0px)';

            // @required
            // 触发浏览器重绘
            this.$slider.css({
                height: this.$slider.height()
            });
        }

        this.animate3d(slider, (dis * -1) + 'px');

        this.currentDis = dis;
    }

});

module.exports = Tab;
