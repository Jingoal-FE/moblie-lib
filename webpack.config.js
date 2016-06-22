/**
 * @file webpack.config.js
 * @author deo
 *
 * webpack config
 */

var path = require('path');

// Webapck utils
var Webpacker = require('./tool/webpack-lib/index');

var root = path.join(__dirname, '/');

var webpacker = new Webpacker({
    debug: false
}, root);

module.exports = webpacker.webpackConfig;
