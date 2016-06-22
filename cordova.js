/* eslint-disable */

/**
 * 模拟一下 手机端 需要的 deviceready
 */
setTimeout(function () {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('deviceready', true, true);
    document.dispatchEvent(evt);
}, 1000);

setTimeout(function () {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('DOMContentLoaded', true, true);
    document.dispatchEvent(evt);
}, 0);



var CPNavigationBar = {
    redirect: function (url, data) {
        window.location.href = url;
    },

    setLeftButton: function (rightBtnIconPath, rightBtnArr) {
        
    },

    setRightButton: function (rightBtnIconPath, rightBtnArr) {
        
    },

    setGoBackHandler: function (rightBtnIconPath, rightBtnArr) {
        
    },

    setTitle: function (rightBtnIconPath, rightBtnArr) {
        
    },

    setButtonEnable: function () {
        //将右侧按钮置灰
        // CPNavigationBar.setButtonEnable('right', false);
    }
};


var randomData = function (key) {
    return 'Name-' + key || (Math.floor(Math.random() * 1000));
};

/**
 * 模拟来模拟去
 */
var getMockData = {

    // 获取人员信息
    'pubdata/userInfo': function (params) {
        var data = [];
        var jids = params.jids;

        jids.forEach(function (item) {
            data.push({
                jid: item,
                name: randomData(item)
            });
        });

        return {
            action: 'pubdata/userInfo',
            code: 0,
            rel: {
                dataFlag: 0,
                contacts: data
            }
        };
    },

    // 获取人员头像
    'pubdata/contactIcon': function (param) {

        return {
            action: 'pubdata/contactIcon',
            code: 0,
            rel: {
                jid: param.jid,
                base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABMCAMAAADqdUGXAAAAsVBMVEUAAAA8peg8peg6o+Ysk9Y8pegultgwmNoymt0zm90tldcvltkvl9kxmdsxmdwymtwymtwymt00nN88pejF5PgqkdPD4/hqu+6SzfI+pum23fZPrupDqemPy/JRr+uz3PaMyvJNreq53/e84fe43vdwve6o1/Wh1PSVzvN9w/BluO3A4vic0vR3we9UsOtSsOum1vSY0POTzvKIyfFas+ys2fWEx/F1v+9KrOoxmdw7pOeMHi//AAAAE3RSTlMAkO8G++zru0oi9N/ToIx3YzUSNqNiawAAAgpJREFUWMPt1mtzojAYBWDR7bbd+25eECR4Q4pQbWu1l93//8PWHEdenDiThHzqjOcTMnMek0yA9AbBlXDLde8kgXBN+P0E6LsD4Y82IDoA4U9fIPzlC4Q3vsCnGx8Awm8fAMKtB4B8ufUAkM9/fAAIAw8A+doJ+NsSvnUB/rWFawA+uQDngVm1LJdvsisgM0LmRTdgN6djsqQDUETEiRNn4A3F+1VWRiw4ADVqW7V+jxMWrIH3XP39UCAzFqyB5b4R1QJhwR5IVeFVCE2wBSo1ASl0wRZ4JqKVEJrwnFgCK7V5ml+JJhiBmIiemgUZDVnI7ICC9tkd+xRBwJMxsQOk2gajFJcjIghrPFcPBoCH0AjD6CDIJ/THL1sTgEzPCaq/wDqYgSQ+I4zRZ0EDTAL6LOiAeQx3xIIJYGEt20I8gmAEWIjpriVUIoUwNQMQkLawDwsGgIX5WBgFBnRh/ihS8xgA6InRHy8Ms2BAy3Si+ufXoTAByHH/VOIgLGQj5NIOeMH77LCj1IIiDxiCCdCfrIXqI+X+5tIMIDEL8oQtLYGEBc5KG4GbgLdWpQH2wlbdSDXAWqgjngED9kJ9r7bBuz3Awk7N/xVf/1rYAyxQmW1yXKyFC8ACgr4bAGHa1PO620GzyAnZzLqeVGURl5tq9mHOyhfgArgDfb/+VS/wA4LeIPAYQz8Y/Ac7onOE7MBX0gAAAABJRU5ErkJggg=='
            }
        };
    }
};

var CPPubData = {

    getPubData: function (options, fn) {

        setTimeout(function () {
            var method = getMockData[options.action];

            if (method) {
                fn(method(options.parameter));
                return;
            }

            console.warn('Function [' + options.action + '] not find.');
        }, 100);
    }
};

console.log('hello! cordova.js');