/**
 * @file msg.js
 * @author deo
 *
 * 错误码配置
 */

var lang = require('common/lang').getData();

// 是否进行了 ajax 通用错误提示的弹窗
window.isAjaxErrorAlert = false;

// 获取错误配置
var err = {};

if (lang && lang.error) {

    for (var k in lang.error) {
        if (lang.error.hasOwnProperty(k)) {
            err[k] = lang.error[k];
        }
    }
}

/**
 * 创建弹出框
 *
 * @return {Element}
 */
var createAlert = function () {

    if ($('.ialert-outter').length > 0) {
        return;
    }

    $('body').append('<div class="ialert-outter hide"><div class="ialert-inner"></div></div>');

    return $('.ialert-outter');
};

var $alert = createAlert();
var $content = $alert.find('.ialert-inner');

var delayId = null;
var delay = 1200;

var closeAlert = function () {

    clearTimeout(delayId);

    delayId = setTimeout(function () {
        $alert.addClass('hide');

        // 添加标记
        window.isAjaxErrorAlert = false;
    }, delay);
};

module.exports = {

    pause: function () {
        clearTimeout(delayId);
    },

    alert: function (code, msg) {
        // 添加标记
        window.isAjaxErrorAlert = true;

        msg = err[code] || msg;

        $content.html(msg);
        $alert.removeClass('hide');

        closeAlert();
    }
};
