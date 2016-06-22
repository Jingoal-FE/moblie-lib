/**
 * @file index.js
 * @author deo
 *
 * 调用对应语言包的入口文件
 */

/* eslint-disable */

var zh_CN = require('./zh_CN');
var zh_TW = require('./zh_TW');

module.exports = {
    zh_CN: zh_CN,
    zh_TW: zh_TW
};