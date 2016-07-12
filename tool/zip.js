/**
 * @file zip.js
 * @author deo
 */
var ZipWriter = require('moxie-zip').ZipWriter;
var zip = new ZipWriter();
var fs = require('fs');
var path = require('path');

var exclueFiles = [
    /^\.+/,
    /.+\.sh$/
];

/**
 * 遍历当前目录下的所有文件
 *
 * @param {string} dir, 当前目录
 * @param {Function} done, 当获得所有的文件之后的回调函数
 */
var walk = function (dir, done) {
    var results = [];

    fs.readdir(dir, function (err, list) {
        if (err) {
            return done(err);
        }

        var i = 0;
        (function next() {
            var file = list[i++];

            if (!file) {
                return done(null, results);
            }

            file = dir + '/' + file;

            /**
             * 递归子目录
             *
             * @param {string} dir, 当前的子目录
             */
            var walkRecur = function (dir) {
                walk(dir, function (err, res) {
                    results = results.concat(res);
                    next();
                });
            };

            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walkRecur(file);
                }
                else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

walk('.', function (err, results) {
    // 遍历所有的文件，并将文件放入其中
    results.forEach(function (file) {
        // 生成的在zip包中的名字
        var name = path.normalize(file);
        // 本地的路径
        var fileName = path.parse(file).base;
        var validFile = true;

        // 排除掉我们想排除的文件
        exclueFiles.forEach(function (reg) {
            if (reg.test(fileName) && validFile) {
                validFile = false;
            }
        });

        if (validFile) {
            zip.addFile(name, file);
        }
    });

    // 打包完成
    zip.saveAs('dist.zip');
});
