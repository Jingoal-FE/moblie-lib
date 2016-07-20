/* eslint-disable */
/* demo */
var util = require('common/util');

function DifferSlip(options) {

    this.opts = {
        /**
         * 将要被 fixed 的元素
         */
        target: null,

        /**
         * 触发滑动的容器
         */
        scrollElement: null,

        /**
         * 根据触发器的滑动的元素
         */
        followElement: null
    };

    $.extend(this.opts, options);

    this.$scroll = $(this.opts.scrollElement);
    this.$follow = $(this.opts.followElement);

    this.init();
}

DifferSlip.prototype = {
    
    init: function () {

        this.bindEvents();
    },

    setTarget: function (target) {
        this.opts.target = target;
        var $target = this.getTarget();

        this.$placeholder = $('<div class="sticky"></div>');

        this.$placeholder.css({
            width: $target.width(),
            height: $target.height()
        });

        // $target.css({
        //     position: '-webkit-sticky',
        //     top: 0,
        //     zIndex: 111
        // });

        $target.wrapAll(this.$placeholder);
    },

    getTarget: function () {
        return $(this.opts.target);
    },

    getFixedHeight: function () {
        var $t = this.getTarget();
        return $t ? $t.height() : 0;
    },

    getFollowHeight: function () {
        return this.$follow.height();
    },

    bindEvents: function () {
        var me = this;

        // 动画执行时间
        var time = 400;
        // 用时
        var timeUsed = 0;
        // 是否进行fixed 动画
        var tofixed = false;
        // 定时器执行时间
        var step = 13;

        this.$scroll
            .on('touchstart', function () {

                var $target = $(this);

                me.start = $target.offset().top;
            })
            .on('click', function () {

                var $target = $(this);
                var $view = me.getTarget();

                var end = me.getFixedHeight();
                var scrollDis = end - me.start;
                var followDis = end - me.getFollowHeight();
                var viewDis = me.getFollowHeight() - $view.offset().top - $view.offset().height;

                me.$scroll[0].style[util.prefixStyle('transform')] = 'translate3d(0, '+ scrollDis +'px, 0px)';
                me.$scroll[0].style['transition'] = 'transform '+ time +'ms cubic-bezier(0.42, 0, 0.58, 1.0)';

                me.$follow[0].style[util.prefixStyle('transform')] = 'translate3d(0, '+ followDis +'px, 0px)';
                me.$follow[0].style['transition'] = 'transform '+ time +'ms cubic-bezier(0.42, 0, 0.58, 1.0)';

                clearTimeout(timer);

                var timer = setInterval(function () {
                    var placeholderTop = me.$placeholder.offset().top;
                    
                    timeUsed = timeUsed + step;

                    if (placeholderTop < 0 && tofixed === false) {
                        var fixedTime = time - timeUsed;

                        $view[0].style[util.prefixStyle('transform')] = 'translate3d(0, '+ viewDis +'px, 0px)';
                        $view[0].style['transition'] = 'transform '+ fixedTime +'ms cubic-bezier(0.42, 0, 0.58, 1.0)';
                        $view.css({
                            zIndex: 99
                        });

                        tofixed = true;
                    }
                }, step);

                setTimeout(function () {
                    clearTimeout(timer);
                }, time);
            });
    }
};

module.exports = DifferSlip;
