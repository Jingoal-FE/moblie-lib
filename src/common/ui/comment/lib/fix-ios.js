/**
 * @file fix-ios.js
 * @author deo
 *
 * Fix ios bugs +,+
 */

var exports = {};

// var $window = $(window);

/**
 * 修正 fixed 到底部的输入框在 IOS 中的 bug
 */
exports.thirdkeyboard = {

    // 延迟执行键盘弹出后的输入框置地动画 timer id
    delayTimerId: null,

    /**
     * 弹开键盘之前的滚动条高度
     * @param {number}
     */
    beforeOpenTop: 0,

    /**
     * 打开键盘的修正代码
     *
     * @param {Element} $inputLayout, 输入框的外层容器
     */
    open: function ($inputLayout) {

        clearTimeout(this.delayTimerId);
        this.delayTimerId = setTimeout(function () {

            $inputLayout[0].scrollIntoView();
        }, 380);
    },

    /**
     * 关闭键盘
     *
     * @param {Element} $inputLayout, 输入框的外层容器
     */
    close: function ($inputLayout) {

        // 键盘收起来之后，滚动回展开前的位置
        // $window.scrollTop(this.beforeOpenTop);

        // // 恢复
        // $inputLayout.css({
        //     position: 'fixed',
        //     top: 'auto',
        //     bottom: 0
        // });
    }
};

module.exports = exports;
