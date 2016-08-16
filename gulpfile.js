/**
 * @file gulpfile.js
 * @author deo
 *
 * ----------------------------------------------
 * Dev gulpfile
 * ----------------------------------------------
 */
/* eslint-disable */
'use strict';

var path = require('path');
var gulp = require('gulp');
var server = require('./tool/webpack-lib/server');
var mockServer = require('./tool/webpack-lib/deo-mock-server');

// Webapck utils
var Webpacker = require('./tool/webpack-lib/index');

var os = require('os');
var getIfs = function () {
    var osnet = os.networkInterfaces();
    return (osnet.en0 || osnet.eth0) || osnet['以太网'];
};
var getIp = function () {
    var ifsArr = getIfs();

    for (var i = 0; i < ifsArr.length; i++ ) {
        var ifs = ifsArr[i];
        if (/ipv4/i.test(ifs.family)) {
            return ifs.address;
        }
    }
};

/**
 * webpack config
 */
var config = {

    // 项目 root 节点
    root: path.join(__dirname, '/'),

    // 页面入口目录，js 和 html 同名，则判定为页面入口
    entry: 'demo/',

    debug: true,

    host: '127.0.0.1',
    // host: getIp(),

    port: 8014,

    publicPath: '/',

    // 是否使用 https 启动服务，今目标后端接口目前为全站 https,
    // 本地 mock 开发可以关闭
    https: true
};

// mock
config.mock = {

    host: config.host,

    port: 8015,

    // allowOrigin: 'https://task2.test1.com:8014',
    allowOrigin: 'https://' + config.host + ':' + config.port
};

/**
 * 开发模式
 */
gulp.task('dev', function () {

    // 启动 mock 服务
    mockServer('./mock', config.mock, config.https);

    var webpacker = new Webpacker(config);

    webpacker.devStart();
});
