/**
 * @file config.js
 * @author deo
 *
 * 前端请求配置
 */
var config = {

    debug: false,

    /**
     * 这个位置请配置正式环境的参数
     */
    API: {

        // 目前 host 由 mbreq 控制
        host: '',

        prefix: '/mgw/task/v1/',

        TEST_URL: 'test'
    }
};

config.const = {
    PARAMS: 'Mobile-Lib',

    // 用于日志 数据中心需要
    PRODUCT_TAG: 'moblie-lib',

    // 日志的 ls db key
    LOG_KEY: 'MOBILE_LOG'
};

config.debug = true;
if (config.debug) {
    var loc = window.location;

    // 直接走 mock server
    // config.API.host = document.location.protocol + '//task2.test1.com:8015';
    config.API.host = loc.protocol + '//' + loc.hostname + ':8015';
    config.API.prefix = '/data/';

    // 联调
    // config.API.host = 'https//web.test1.com';
    // config.API.prefix = '/mgw/task/v1/';
}

module.exports = config;
