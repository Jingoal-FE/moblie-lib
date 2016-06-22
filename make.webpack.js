/**
 * @file make-webpack.config.js
 * @author deo
 */
'use strict';
var _ = require('underscore');
var path = require('path');
var webpack = require('webpack');
var CopyPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


var dep = path.join(__dirname, '/dep/');
var common = path.join(__dirname, '/src/common/');


/**
 * Make webpack config method
 * webpack-lib 会自动调用 make.webpack.js
 * function 的 this 指向 webpack-lib/index.js
 */
module.exports = function () {

    var config = this.config;

    var webpackConfig = {};

    if (config.debug) {
        webpackConfig.devtool = 'eval-source-map';
    }

    // 页面 js 入口
    webpackConfig.entry = this.jsEntries;

    var copyPlugins = [
        // {
        //     from: './dep/ui/',
        //     to: './dep/ui/'
        // }
        // ,
        {
            from: './src/img/shell/',
            to: './img/shell/'
        }
    ];

    // 非生产环境，需要使用 mock cordova.js 
    if (process.env.NODE_ENV !== 'prod') {
        copyPlugins.push({
            from: './cordova.js',
            to: './cordova.js'
        });
    }
    // 生产环境
    else {
        webpackConfig.devtool = false;
    }

    // 设置 resolve
    webpackConfig.resolve = {

        // 指定模块查找的根目录
        root: [this.src, '/node_modules'],

        alias: {
            zepto: dep + 'zepto',
            dep: dep,
            common: common,

            mob: dep + 'ui/mobiscroll/js/mobiscroll-2.17.0.js'
        },

        extensions: ['', '.js', '.tpl', '.html']
    };

    // 输出配置
    webpackConfig.output = {

        // 输出根目录
        path: path.join(__dirname, 'dist'),

        // 输出文件
        // filename: config.debug ? '[name].js' : 'common/js/[name].[hash].min.js',
        filename: config.debug ? '[name].js' : 'js/[name].min.js',

        // 调试目录 或者 CDN 目录 
        publicPath: config.debug ? './' : './',

        // chunkFilename: config.debug ? '[chunkhash:8].chunk.js' : 'common/js/[chunkhash:8].chunk.min.js'
        chunkFilename: config.debug ? 'chunk.js' : 'js/chunk.min.js'
    };

    // 图片 path
    // img 为 输出后的 图片的 文件夹
    var imgPath = config.debug ? '' : 'img/';

    // module 加载器
    webpackConfig.module = {

        preLoaders: [],

        // 添加一个内置的 loaders 
        loaders: [
            {
                // 模板 加载器
                // Reference: https://github.com/webpack/html-loader
                test: /\.tpl$/,
                loader: 'html-loader'
            },
            {
                test: /\.css$/, 
                loader: this.getCssLoader()
            },
            { 
                // sass 加载器
                // Reference: https://github.com/webpack/style-loader
                // Reference: https://github.com/webpack/css-loader
                // Reference: https://github.com/webpack/sass-loader
                // Reference: https://github.com/webpack/extract-text-webpack-plugin
                test: /\.scss$/, 
                loader: this.getCssLoader('sass')
                // include: [path.resolve(__dirname, config.srcDir + 'static/css')],  //把要处理的目录包括进来
                // exclude: []  //排除不处理的目录
            },
            {
                // 图片加载器
                // Reference: https://github.com/webpack/url
                test: /\.(jpe?g|png|gif)$/i,
                loaders: [
                    'url-loader?limit=1&name=' + imgPath + '[name].[ext]'
                    // 'url-loader?limit=1&name=' + imgPath + '[hash:8].[name].[ext]'
                ]
            }
        ]
    };

    // var ignoreFiles = new webpack.IgnorePlugin(/\/mobiscroll-2.17.0.js$/);

    // 插件集合
    webpackConfig.plugins = [

        // to: 实际为 path/xxx
        new CopyPlugin(copyPlugins),

        // 提供全局使用
        new webpack.ProvidePlugin({
            $: 'zepto'
        })
    ];

    var commonPlugins = this.getCommonPlugins();

    // 提取公共部分
    webpackConfig.plugins = webpackConfig.plugins.concat(commonPlugins);

    // * 最为重要的部分，其中包含页面入口配置
    webpackConfig.plugins = webpackConfig.plugins.concat(this.htmlPlugins);

    // if (!config.debug) {
        // 提取样式
        // Reference: https://github.com/webpack/extract-text-webpack-plugin
        // 'common/css/[contenthash:8].[name].min.css'
        webpackConfig.plugins.push(
            new ExtractTextPlugin('css/[name].min.css', {
                allChunks: true
            })
        );
    // }

    console.log(webpackConfig);

    return webpackConfig;

};
