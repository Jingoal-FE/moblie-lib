
require('./index.scss');
var Page = require('common/page');

require('common/ui/dataloader/dataloader.scss');
var DataLoader = require('common/ui/dataloader/dataloader.scroll');

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

    promise: function () {
        return Page.get('list', {
            page: this.page
        });
    },

    lang: function () {
        this.setMore('default', '上拉加载更多');
    },

    onComplete: function (data) {
        data && this.render(data);
    },

    onFailed: function () {
        this.error();
    }
});

dataLoader.on('refresh', function (event, data) {
    data && this.render(data);
});

dataLoader.on('more', function (event, data) {
    data && this.render(data, 'append');
});
