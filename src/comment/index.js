/**
 * @file index.js
 * @author deo
 *
 */

require('./index.scss');
var Page = require('common/page');
var page = new Page();

require('common/ui/comment/comment.scss');
var Comment = require('common/ui/comment/comment');
var commentTpl = require('common/ui/comment/comment.tpl');

page.enter = function () {


    // var me = this;

    // $('#main').height($(window).height());
    // me.scroll = new IScroll('#main');

    new Comment({
        tpl: commentTpl
    });

    // var $selector = $('#testA');

};

page.bindEvents = function () {

};

page.start();
