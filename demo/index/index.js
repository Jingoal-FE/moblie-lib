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

/**
 * 页面逻辑
 */
page.enter = function () {

    console.info('Enter');

    console.log(this.lang);
    console.log(this.data);

    this.render('#main', this.data);

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

// page.failedRender = function () {
//     $('#main').html('<div class="page-failed">' + this.lang.pageFailed + '</div>');
// };

/**
 * 请求页面接口
 *
 * @param {deferred} dfd, deferred
 */
page.addParallelTask(function (dfd) {
    var me = this;

    var promise = page.get(config.API.TEST_URL, {
        id: util.getParam('id')
    });

    console.info('addParallelTask');

    promise
        .done(function (result) {
            if (result && result.meta && result.meta.code === 200) {
                console.info('Data Success');
                me.data = result.data;
                dfd.resolve();
            }
            else {
                dfd.reject(null);
            }
        })
        .fail(function (err) {
            // Do something
            dfd.reject();
        });

    return dfd;
});

page.start();
