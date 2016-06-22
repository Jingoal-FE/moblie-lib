/**
 * @file ui.js
 * @author deo
 *
 * utils 封装原生
 */

/* eslint-disable */
var util = require('common/util');
var lang = require('common/lang').getData();

var ui = {};

ui.alert = function (options) {

    var opts = {
        title: '',
        content: '',
        cancel: lang.cancel || 'Cancel',
        apply: lang.confirm || 'Apply',
        onCancel: function () {},
        onApply: function () {}
    };

    $.extend(opts, options);

    var myApply = {
        title: opts.apply,
        callback: opts.onApply
    };

    var myCancel = {
        title: opts.cancel,
        callback: opts.onCancel
    };

    CPUtils.showAlertView(opts.title, opts.content, myCancel, myApply);
};

module.exports = ui;
