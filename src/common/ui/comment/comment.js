/**
 * @file comment.js
 * @author deo
 *
 * 评论组件
 */

var Control = require('common/control');
var util = require('common/util');
// 修正 ios bugs
var fixIOS = require('./lib/fix-ios');

var OPENED_CLASS = 'comment-opened';

function Comment(options) {

    // 默认渲染到 body 中
    options.wrapper = options.wrapper || 'body';

    options.main = options.main || '.comment';

    Control.call(this, options);

    this.opts = getOptions(options);

    this._fixIOSTimer = null;

    this.init();
}

$.extend(Comment.prototype, Control.prototype);

function getOptions(options) {
    var opts = {};

    return $.extend(opts, options);
}

$.extend(Comment.prototype, {

    /**
     * Init
     */
    init: function () {
        // 先渲染出 控件
        this.render({}, 'append');

        this.$main = $(this.opts.main);
        this.$input = this.$main.find('textarea');

        this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
        var me = this;

        me.$input
            .on('click', function () {

                me.open();

                // 修正键盘问题
                // me.fixIOSThirdkeyboard();

                // 非苹果 不做 fix
                if (util.isApple()) {
                    fixIOS.thirdkeyboard.open();
                }
            })
            .on('blur', function () {
                me.close();

                if (util.isApple()) {
                    fixIOS.thirdkeyboard.close();
                }
            });
    },

    /**
     * 点击输入框 打开键盘
     */
    open: function () {
        this.$main.addClass(OPENED_CLASS);

        // 打开后禁用 touchmove
        $(document).on('touchmove.comment', function (event) {
            event.preventDefault();
        });
    },

    /**
     * 点击输入框 关闭键盘
     */
    close: function () {
        this.$main.removeClass(OPENED_CLASS);

        $(document).off('touchmove.comment');
    }
});

module.exports = Comment;
