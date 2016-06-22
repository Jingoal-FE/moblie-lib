/**
 * @file config.js
 * @author deo
 *
 * 前端请求配置
 */
var config = {

    debug: true,

    /**
     * 这个位置请配置正式环境的参数
     */
    API: {
        // 用于发送异步请求
        host: document.location.protocol + '//' + window.location.hostname + ':8015',

        prefix: '/data/',

        TEST_URL: 'test',
    }
};

config.const = {
    PARAMS: 'Mobile-Lib'
}

module.exports = config;
