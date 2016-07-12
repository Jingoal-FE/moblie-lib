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
// var mock = require('./tool/webpack-lib/mock');
var server = require('./tool/webpack-lib/server');
var mockServer = require('./tool/webpack-lib/deo-mock-server');

// Webapck utils
var Webpacker = require('./tool/webpack-lib/index');

var connect = require('gulp-connect');

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

    debug: true,

    // host: '127.0.0.1',
    host: getIp(),

    port: 8014,

    publicPath: '/',

    https: false
};

// mock
config.mock = {

    host: config.host,
    port: 8015,

    // proxyPrefix: null,
    // allowOrigin: 'https://task2.test1.com:8014'
    allowOrigin: 'https://' + config.host + ':' + config.port
};

var root = path.join(__dirname, '/');

// 启动 mock 服务
mockServer('./mock', config.mock, config.https);

/**
 * 开发环境
 */
gulp.task('dev', function () {

    config.debug = true;

    var webpacker = new Webpacker(config, root);

    webpacker.devStart();
});
