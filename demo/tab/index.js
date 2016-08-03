/**
 * @file index.js
 * @author deo
 *
 * 首页
 */
/* eslint-disable */
require('./index.scss');

var config = require('src/config');
var Page = require('common/page');
var page = new Page();

var Tab = require('common/ui/tab/tab');

/**
 * 页面逻辑
 */
page.enter = function () {

    var tab = new Tab({
        main: '#tab',
        viewNum: 3,
        activeIndex: 0
    });

    tab.on('click', function (event, target) {
        console.log(target)
    });

    this.bindEvents();
};

/**
 * 事件绑定
 */
page.bindEvents = function () {

};

/**
 * 设备逻辑
 */
page.deviceready = function () {

    // 原生
};

page.start();
