/**
 * @file comment.js
 * @author deo
 *
 * 评论组件
 */

var Control = require('common/control');
var util = require('common/util');

var OPENED_CLASS = 'comment-opened';

/**
 * Main Mai Ma M
 */
function Comment(options) {

    // 默认渲染到 body 中
    options.wrapper = options.wrapper || 'body';

    options.main = options.main || '.comment';

    // 继承 Control
    Control.call(this, options);

    this.opts = getOptions(options);

    this._blurTimerId = null;
    this._closeTimerId = null;
    this._fixTimerId = null;

    /**
     * 展开评论框之前的 scrollTop
     */
    this._beforeTop = 0;

    /**
     * 评论框是否被打开
     */
    this._opened = false;

    this.init();
}

$.extend(Comment.prototype, Control.prototype);

/**
 * 默认值
 */
function getOptions(options) {

    var opts = {

        // 输入文字上限
        limit: 7,

        zIndex: 90,

        // Ajax 请求
        promise: null,

        /**
         * 是否需要附件功能
         */
        hasAttach: true,

        /**
         * 是否需要字数限制功能
         */
        hasLimit: true,

        /**
         * 是否需要删除按钮
         */
        hasDelete: true,

        /**
         * 是否有控制条
         */
        hasControls: true,

        /**
         * 大于多少个字符，则显示删除按钮
         */
        deleteShowLength: 4
    };

    return $.extend(opts, options);
}

$.extend(Comment.prototype, {

    /**
     * Init
     */
    init: function () {
        // 先渲染出 控件
        this.render({}, 'append');

        this.$main = $(this.opts.wrapper).find(this.opts.main);
        this.$input = this.$main.find('textarea');
        this.$send = this.$main.find('.comment-send');
        this.$delete = this.$main.find('.comment-delete');
        this.$limit = this.$main.find('.comment-limit');
        this.$attach = this.$main.find('.comment-attach');
        this.$controls = this.$main.find('.comment-checkbox');

        // 添加遮罩
        this.addShadow();

        // 绑定事件
        this.bindEvents();

        // 如存在删除按钮，给评论框外层容器添加一个样式备用
        if (this.opts.hasDelete && this.$delete && this.$delete.length > 0) {
            this.$main.addClass('exist-delete-button');
        }
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
        var me = this;

        me.$input
            .on('focus', function () {
                me.closePause();
                if (me._opened === false) {
                    me.open();
                }
            })
            .on('input', function () {
                me.deleteDisplay();
            })
            .on('blur', function () {
                me.closeDelay();
            });

        // 点击遮罩
        me.$shadow.on('click', function () {
            me.close();
        });

        // 发送按钮
        me.$send.on('click', function () {

            // 超过字数限制，不进行后续操作
            if (me.isOutLimit()) {
                me.closePause();
                return;
            }

            if (me.opts.promise) {
                me.send();
            }
            // 在外部调用
            else {
                me.closePause();
                me.fire.call(me, 'send', this);
            }

            me.$input.focus();
        });

        // 附加栏
        if (me.opts.hasControls) {
            me.$controls.on('click', function () {

                // 添加选中样式
                $(this).toggleClass('selected');

                me.$input.focus();
            });
        }
        else {
            me.$controls && me.$controls.addClass('hide');
        }

        // 点击附件
        if (me.opts.hasAttach) {
            me.$attach.on('click', function () {
                me.closePause();

                if (me._opened) {
                    me.$input.focus();
                }

                me.fire.call(me, 'attach', this);
            });
        }
        else {
            me.$attach && me.$attach.addClass('hide');
        }

        // 删除输入的内容
        if (me.opts.hasDelete) {
            me.$delete.on('click', function () {
                me.closePause();

                me.clear();
                me.$input.focus();
            });
        }
        else {
            me.$delete && me.$delete.addClass('hide');
        }
    },

    /**
     * 添加 遮罩，并且设置 z 值
     */
    addShadow: function () {
        this.$shadow = $('<div class="comment-shadow hide"></div>');

        $(document.body).append(this.$shadow);

        this.$shadow.css({
            position: 'fixed',
            zIndex: this.opts.zIndex - 1
        });

        this.$main.css({
            zIndex: this.opts.zIndex
        });
    },

    /**
     * 点击输入框 打开键盘
     */
    open: function () {
        var me = this;

        this._beforeTop = window.scrollY;

        this.$main.addClass(OPENED_CLASS);
        this.$shadow.removeClass('hide');

        // 非苹果 不做 fix
        // 苹果第三方键盘无法弹到键盘上方
        if (util.isApple()) {
            clearTimeout(this._fixTimerId);
            this._fixTimerId = setTimeout(function () {

                // 直接把输入框置于容器的最底部
                me.$main.css({
                    position: 'absolute',
                    top: document.documentElement.scrollHeight,
                    bottom: 'auto'
                });

                me.$main[0].scrollIntoView();
            }, 180);
        }

        this.deleteDisplay();
        this.limitChecker();

        this._opened = true;
    },

    /**
     * 点击输入框 关闭键盘
     */
    close: function () {
        var me = this;
        me.$main.removeClass(OPENED_CLASS);
        me.$shadow.addClass('hide');

        clearTimeout(me._closeTimerId);
        me._closeTimerId = setTimeout(function () {
            me.opts.hasDelete && me.$delete.addClass('hide');
            me.opts.hasLimit && me.$limit.addClass('hide');
        }, 37);

        me.$input.blur();

        $(window).scrollTop(this._beforeTop);

        me.$main.css({
            position: 'fixed',
            top: 'auto',
            bottom: 0
        });

        me._opened = false;
    },

    /**
     * 延迟关闭，避免在点击 checkbox, button 等 就直接关闭了输入框
     */
    closeDelay: function () {
        var me = this;

        me.closePause();
        me._blurTimerId = setTimeout(function () {
            me.close();
        }, 37);
    },

    /**
     * 暂停关闭评论框
     */
    closePause: function () {
        clearTimeout(this._blurTimerId);
    },

    /**
     * 获取数据
     */
    getValue: function () {
        return $.trim(this.$input.val());
    },

    /**
     * 获取字符串长度，中文字符算2个
     */
    getByteLength: function () {
        var val = this.getValue();
        var len = 0;

        for (var i = 0; i < val.length; i++) {
            var code = val.charCodeAt(i);
            if (code >= 0 && code <= 128 ) {
                len += 1;
            }
            else {
                len += 2;
            }
        }
        return len;
    },

    /**
     * 是否超过输入限制
     */
    isOutLimit: function () {
        if (!this.opts.hasLimit) {
            return false;
        }

        return this.getByteLength() > this.opts.limit;
    },

    /**
     * 获取被选中的项
     *
     * @param {string} selectorQuery, 过滤条件 '[data-name=xx]', '.class name', ...
     */
    getSelect: function (selectorQuery) {
        var $selected = this.$main.find('.selected');

        if ($selected.length <= 0) {
            return;
        }

        return $selected.filter(selectorQuery);
    },

    /**
     * 清空数据
     */
    clear: function () {
        this.$input.val('');
        this.$delete.addClass('hide');
        this.limitChecker();
    },

    /**
     * 发送接口
     */
    send: function () {
        var me = this;
        var promise = me.opts.promise;

        me.closePause();

        if (me.getValue().length <= 0) {
            return;
        }

        promise(me)
            .done(function (result) {
                me.fire.call(me, 'done', result);

                me.clear();
            })
            .fail(function (err) {
                me.fire.call(me, 'fail', err);
            })
            .always(function () {
                me.close();
            });
    },

    /**
     * 删除按钮的显示隐藏
     */
    deleteDisplay: function () {
        if (!this.opts.hasDelete) {
            return;
        }

        if (this.getValue().length > this.opts.deleteShowLength) {
            this.$delete.removeClass('hide');

            this.limitChecker();
        }
        else {
            this.$delete.addClass('hide');
        }
    },

    /**
     * 输入限制的检查
     */
    limitChecker: function () {
        if (!this.opts.hasLimit) {
            return;
        }

        var isOutLimit = this.isOutLimit();

        if (isOutLimit) {
            this.$limit
                .removeClass('hide')
                .html(this.opts.limit - this.getByteLength());
        }
        else {
            this.$limit
                .addClass('hide')
                .html('');
        }
    }
});

module.exports = Comment;
