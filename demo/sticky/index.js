/**
 * @file index.js
 * @author deo
 *
 * 首页
 */
/* eslint-disable */

require('common/css/global.scss');
require('./index.scss');

var config = require('src/config');
var util = require('common/util');
var Page = require('common/page');
var page = new Page();

var DifferSlip = require('dev/differSlip');

/**
 * 页面逻辑
 */
page.enter = function () {
    // new Sticky({
    //     target: '#sticky'
    // });


    var differSlip = new DifferSlip({
        scrollElement: '#b',
        followElement: '#a'
    });

    $('#a > div').on('click', function () {
        differSlip.setTarget(this);
    });

    $('#a > div').eq(2).triggerHandler('click');

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
    console.info('Deviceready');

    // 原生
};

/**
 * 加载失败
 */
page.failed = function () {
    console.info('Page Fail');
    // page.failedRender();
};

page.start();
