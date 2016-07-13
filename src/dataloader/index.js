/**
 * @file index.js
 * @author deo
 *
 */

require('./index.scss');
var Page = require('common/page');

require('common/ui/dataloader/dataloader.scss');
var DataLoader = require('common/ui/dataloader/dataloader');

var listTpl = require('./list.tpl');
var errTpl = require('./err.tpl');

var dataLoader = new DataLoader({

    wrapper: '.loader-wrapper',
    // render by Control
    tpl: listTpl,
    // render by Control
    errTpl: errTpl,

    scrollModel: true,
    // height: 400,

    autoNullHide: true,

    promise: function () {
        return Page.get('list', {
            page: this.page
        });
    },

    lang: function () {
        this.setMore({
            'default': '上拉加载更多'
        });
    }
});

dataLoader.on('fail', function () {
    this.error();
});

dataLoader.on('refresh', function (event, data) {
    if (!data) {
        data = {
            objList: null
        };
    }

    this.render(data);
});

dataLoader.on('more', function (event, data, isFirst) {
    if (!data) {
        data = {
            objList: null
        };
    }

    this.render(data, isFirst ? 'html' : 'append');
});

