/**
 * @file template.js
 * @author deo
 *
 * 模版文件
 */

var CONST = require('./const');
var lang = require('./lang');

/**
 * 下拉刷新的样式名
 */
var refreshClass = {};

refreshClass[CONST.DEFAULT] = 'dataloader-refresh-default';
refreshClass[CONST.PROCESS] = 'dataloader-refresh-process';
refreshClass[CONST.DONE] = 'dataloader-refresh-done';
refreshClass[CONST.FAIL] = 'dataloader-refresh-fail';
refreshClass[CONST.HOLDER] = 'dataloader-refresh-holder';

/**
 * 加载更多的样式名
 */
var moreClass = {};

moreClass[CONST.DEFAULT] = 'dataloader-more-default';
moreClass[CONST.PROCESS] = 'dataloader-more-process';
moreClass[CONST.DONE] = 'dataloader-more-done';
moreClass[CONST.FAIL] = 'dataloader-more-fail';
moreClass[CONST.HOLDER] = 'dataloader-more-holder';
moreClass[CONST.MAX] = 'dataloader-more-max';
moreClass[CONST.NULL] = 'dataloader-more-null';

/**
 * 获取加载条内部dom
 */
function getHtml(c, type) {

    var htmlArr = [];

    for (var k in c) {
        var myClass = c[k];

        if (k !== CONST.DEFAULT) {
            myClass += ' hide';
        }

        htmlArr.push('<div class="' + myClass + '">' + lang[type][k] + '</div>');
    }

    return htmlArr.join('');
};

/**
 * 用于重新加载数据
 */
var getRefreshHtml = function () {

    var html = getHtml(refreshClass, CONST.REFRESH);

    return '<div class="dataloader-refresh">' + html + '</div>';
};

/**
 * 用于加载更多数据
 */
var getMoreHtml = function () {

    var html = getHtml(moreClass, CONST.MORE);

    return '<div class="dataloader-more">' + html + '</div>';
};

module.exports = {
    getRefreshHtml: getRefreshHtml,
    getMoreHtml: getMoreHtml,
    refreshClass: refreshClass,
    moreClass: moreClass,
    lang: lang
};
