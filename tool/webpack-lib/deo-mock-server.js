/**
 * @file deo-mock-server.js
 * @author deo
 *
 * mock server
 */

/* eslint-disable */

var http = require('http');
var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync(__dirname + '/ssl/server.key'),
    cert: fs.readFileSync(__dirname + '/ssl/server.crt')
};

var getHeaders = function (origin) {

    return {
        'Content-Type': 'application/json; charset=utf-8',
        // 解决跨域, 允许任意 origin
        'Access-Control-Allow-Origin': origin,
        // 前端使用 withCredentials: true 来模拟 cookie 传递，同时 Origin 不能用 *
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, campo-proxy-request, x-spdy-bypass'
        // 'Access-Control-Request-Method': 'GET, POST'
    };
};

module.exports = function (dir, config, isHttps) {

    var serverDo = function (req, res) {

        var url = req.url.replace(/(\?.+)/, '');
        var origin = req.headers.origin;

        var expr = /\/data\/(.+)/.exec(url);
        var file = null;

        if (expr && expr.length > 1) {
            file = dir + '/data/' + expr[1] + '.json';

            console.log(file);

            try {
                var buffer = fs.readFileSync(file);

                res.writeHead(200, getHeaders(origin));

                res.end(JSON.stringify(JSON.parse(buffer)));
            }
            catch (ex) {

                // 耍你1秒钟
                setTimeout(function () {

                    res.writeHead(404, getHeaders(origin));

                    res.end(JSON.stringify({
                        error: ex
                    }));
                }, 1000)
            }
        }
        else {

            res.writeHead(404, getHeaders(origin));

            res.end(JSON.stringify({
                error: '[' + url + '] Error.'
            }));
        }
    };

    var server;

    if (isHttps) {
        server = https.createServer(options, function (req, res) {
            serverDo(req, res);
        });
    }
    else {
        server = http.createServer(function (req, res) {
            serverDo(req, res);
        });
    }

    server.listen(config.port, config.host);

};
