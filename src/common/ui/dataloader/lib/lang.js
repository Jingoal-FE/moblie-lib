/**
 * @file lang.js
 * @author deo
 *
 * template.js 使用
 */

var lang = {

    refresh: {
        default: '下拉刷新',
        process: '加载中...',
        done: '加载完成',
        fail: '加载失败，请重试',
        holder: '释放刷新',
        unchanged: '已经是最新数据'
    },

    more: {
        default: '点击加载更多',
        process: '加载中...',
        done: '加载完成',
        fail: '加载失败，请重试',
        holder: '释放刷新',
        max: '内容全部加载完毕',
        null: '暂无数据'
    }
};

module.exports = {

    refresh: lang.refresh,

    more: lang.more,

    setRefresh: function (bar, text) {
        this.set('refresh', bar, text);
    },

    setMore: function (bar, text) {
        this.set('more', bar, text);
    },

    set: function (type, bar, text) {
        if (lang[type] && lang[type][bar]) {
            lang[type][bar] = text;
        }
    }
};
