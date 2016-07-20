/**
 * @file fix-ios.js
 * @author deo
 *
 * Fix ios bugs +,+
 */

var exports = {};

var $window = $(window);

/**
 * 修正 fixed 到底部的输入框在 IOS 中的 bug
 */
exports.thirdkeyboard = {

    timer: null,

    /**
     * 弹开键盘之前的滚动条高度
     * @param {number}
     */
    beforeOpenTop: 0,

    /**
     * 打开键盘的修正代码
     */
    open: function () {
        var me = this;

        me.beforeOpenTop = $window.scrollTop();

        // 修正
        clearTimeout(me.timer);

        me.timer = setTimeout(function () {
            // 滚动底部，让输入框露出来
            $(window).scrollTop(9999);
        }, 360);
    },

    /**
     * 关闭键盘
     */
    close: function () {

        // 键盘收起来之后，滚动回展开前的位置
        $window.scrollTop(this.beforeOpenTop);
    }
};

module.exports = exports;
