/**
 * @file
 * @author
 *
 */
/* eslint-disable */

var _ = require('underscore');
var mockServer = require('gulp-mock-server');

var mockConfig = {
    host: '127.0.0.1',
    port: 8015,
    path: '/',
    mockDir: null,
    https: false,
    fallback: true
};

module.exports = function (options) {

    if (this.config.https) {
        
        mockConfig.directoryListing = true;

        // liveerload = true, https 配置才有用
        mockConfig.livereload = true;

        /**
         * 当后端联调环境为 https 的接口
         * @require 服务端 key.pem
         * @require 服务端 cert.pem
         */
        mockConfig.https = {
            // key: './ssl/keys/server-key.pem',
            // cert: './ssl/keys/server-cert.pem'
            // ca: './ssl/dev/ca.crt'
            key: this.config.https.key || __dirname + '/ssl/server.key',
            cert: this.config.https.cert || __dirname + '/ssl/server.crt'
        };
    }

    if (this.config.mock.proxyPrefix && this.config.mock.proxyPath) {

        mockConfig.proxies = [
            {
                source: this.config.mock.proxyPrefix,
                target: this.config.mock.proxyPath
            }
        ];
    }

    console.log('----- [mock.js] -----');

    _.extend(mockConfig, options);

    if (!mockConfig.mockDir) {
        return;
    }

    return mockServer(mockConfig);
};