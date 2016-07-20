/**
 * @file index.js
 * @author deo
 *
 */

require('./index.scss');
var Page = require('common/page');
var page = new Page();

require('common/ui/dataloader/dataloader.scss');
var DataLoader = require('common/ui/dataloader/dataloader');

var listTpl = require('./list.tpl');
var errTpl = require('./err.tpl');

page.enter = function () {
    var me = this;

    // console.log(me.dataLoader)

    if (me.dataLoader) {
        // me.dataLoader.dispose();
    }

    me.dataLoader = new DataLoader({

        wrapper: '.loader-wrapper',
        // render by Control
        tpl: listTpl,
        // render by Control
        errTpl: errTpl,

        scrollModel: true,
        height: 400,

        autoNullHide: true,

        promise: function () {
            return page.get('list', {
                page: this.page
            });
        },

        lang: function () {
            this.setMore({
                'default': '上拉加载更多'
            });
        }
    });

    me.dataLoader.on('fail', function () {
        this.error();
    });

    me.dataLoader.on('refresh', function (event, data) {
        if (!data) {
            data = {
                objList: null
            };
        }

        this.render(data);
    });

    me.dataLoader.on('more', function (event, data, isFirst) {
        if (!data) {
            data = {
                objList: null
            };
        }

        this.render(data, isFirst ? 'html' : 'append');
    });


    this.bindEvents();
};

page.bindEvents = function () {

    var me = this;

    $('#refresh').on('click', function () {

        me.dataLoader.requestRefresh();
    });
};

page.start();

setTimeout(function () {
    // page.refresh();
}, 1000);
