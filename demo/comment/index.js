/**
 * @file index.js
 * @author deo
 *
 */
require('common/css/global.scss');
require('./index.scss');

var Page = require('common/page');
var page = new Page();

require('common/ui/comment/comment.scss');
var Comment = require('common/ui/comment/comment');
var commentTpl = require('common/ui/comment/comment.tpl');

page.enter = function () {

    var comment = new Comment({

        hasLimit: false,
        hasAttach: false,
        hasControls: false,
        // hasDelete: false,

        // ajax promise
        promise: function (context) {
            var $share = context.getSelect('[data-name="share"]');
            var $creator = context.getSelect('[data-name="creator"]');

            return page.post('test', {
                id: 0,
                value: context.getValue(),
                share: $share && $share.length,
                creator: $creator && $creator.length
            });
        },

        // tpl
        tpl: commentTpl
    });

    // 如果没有 promise， 可以监听该自定义事件
    comment.on('send', function (event, inputTarget) {
        // console.log(this);
        // console.log(inputTarget);

        // 调用接口 关闭评论框
        this.close();
    });

    // promise 的情况下，发送评论完成
    comment.on('done', function (event, data) {
        // console.log(data);
    });

    // promise 的情况下，发送评论失败
    comment.on('fail', function (event, err) {
        // console.log(err);
    });

    // 点击附件按钮
    comment.on('attach', function (event) {
        // console.log('attach');
    });
};

page.bindEvents = function () {

};

page.start();
