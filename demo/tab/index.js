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

var Sticky = require('common/ui/sticky');

// 普通 Tab 功能
var Tab = require('common/ui/tab/tab');

// 支持内容滚动动画
var TabSlide = require('common/ui/tab/tab.slide');

function testt(name){
    return name.split('').reverse().join('');
}
window.testt = testt;

/**
 * 页面逻辑
 */
page.enter = function () {

    this.bindTab();
    this.bindTabSlide();
    this.bindTabSlide1();

    this.bindEvents();
};

page.bindTab = function () {

    var tab = new Tab({
        main: '#tab',
        viewNum: 4,
        activeIndex: 0
    });

    var $content = $('#content');

    tab.on('click', function (event, target) {
        $content.html($(target).html());
    });
};

page.bindTabSlide = function () {

    var tabSlide = new TabSlide({
        main: '#tab-slide',
        viewNum: 3,
        activeIndex: 0
    });

    // 如果有滑动需求，则初始化该方法
    tabSlide.slideInit({
        // width: 300,
        height: 300,
        wrapper: '#content-slide',
        content: '.tab-content'
    });

    new Sticky({
        target: '#tab-slide'
    })
};

page.bindTabSlide1 = function () {

    var tabSlide = new TabSlide({
        main: '#tab-slide1',
        viewNum: 3,
        activeIndex: 0
    });

    // 如果有滑动需求，则初始化该方法
    tabSlide.slideInit({
        screenMoveNum: 1,
        height: 500,
        wrapper: '#content-slide1',
        content: '.tab-content'
    });
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

module.exports = page;
