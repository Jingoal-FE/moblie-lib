// Karma configuration
// Generated on Fri Aug 05 2016 11:06:30 GMT+0800 (CST)


var path = require('path');

var os = require('os');
var getIfs = function () {
    var osnet = os.networkInterfaces();
    return (osnet.en0 || osnet.eth0) || osnet['以太网'];
};

var getIp = function () {
    var ifsArr = getIfs();

    for (var i = 0; i < ifsArr.length; i++ ) {
        var ifs = ifsArr[i];
        if (/ipv4/i.test(ifs.family)) {
            return ifs.address;
        }
    }
};

/**
 * webpack config
 */
var config = {

    debug: true,

    host: getIp(),

    port: 8014,

    publicPath: '/',

    https: false
};
// Webapck utils
var Webpacker = require('./tool/webpack-lib/index');
var webpacker = new Webpacker(config, path.join(__dirname, '/'));
console.log(webpacker);


var dep = path.join(__dirname, '/dep/');
var dev = path.join(__dirname, '/dev/');
var src = path.join(__dirname, '/src/');
var common = path.join(__dirname, '/src/common/');



module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'test/**/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'demo/tab/index.js' : ['webpack', 'coverage'],
        'test/tab/tab.spec.js' : ['webpack']
      // ,'demo/tab/*.js' : ['webpack']
      // ,'src/**/*.js' : ['webpack']
    },

    // webpack: {
    //   // karma watches the test entry points
    //   // (you don't need to specify the entry option)
    //   // webpack watches dependencies

    //   // webpack configuration
    // },

    webpack: webpacker.webpackConfig,

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
        type : 'html',
        dir : 'coverage/'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'/*, 'Firefox', 'Safari', 'IE'*/],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    plugins: [
        require("karma-webpack"),
        require("karma-coverage"),
        require("karma-jasmine"),
        require("karma-chrome-launcher")
    ]
  })
}
