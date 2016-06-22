/* eslint-disable */

var _ = require('underscore');
var devServer = require('webpack-dev-server');
var webpack = require('webpack');

var connect = require('gulp-connect');

/**
 * webpack dev server 配置
 */
var getServerConfig = function (me) {
    return {
        // dev 模式 静态入口文件访问位置
        contentBase: '',
        publicPath: '/',
        port: me.config.port,
        hot: true,
        historyApiFallback: true,
        noInfo: false,
        inline: true,
        watch: true,
        stats: {
            cached: false,
            colors: true
        },

        /**
         * 本地项目用 https:// 访问项目
         * 同时需要 webpack dev server 进行 https 配置
         */
        https: me.config.https

        // webpack dev server source
        // options.https.key = options.https.key || fs.readFileSync(path.join(__dirname, "../ssl/server.key"));
        // options.https.cert = options.https.cert || fs.readFileSync(path.join(__dirname, "../ssl/server.crt"));
        // options.https.ca = options.https.ca || fs.readFileSync(path.join(__dirname, "../ssl/ca.crt"));

    };
};

var servers = {
    
    /**
     * dev server
     */
    dev: function () {

        var serverConfig = getServerConfig(this);

        var compiler = webpack(this.webpackConfig);

        var server = new devServer(compiler, serverConfig);
        var path = (this.config.https ? 'https://' : 'http://') + this.config.host + ':' + this.config.port;

        server.listen(this.config.port, this.config.host, function(a) {
            console.log('----- [server.js] webpack server start -----');
            console.log('dev server: ' + path);
        });

        return server;
    },

    /**
     * 启动一个模拟生产环境的 connect
     */
    connect: function () {

        return connect.server({
            root: this.webpackConfig.output.path,
            port: this.config.port,
            https: this.config.https,
            livereload: true
        });
    },

    /**
     * 模拟打包
     */
    build: function () {

        // Run webpack
        webpack(

            // webpack config
            this.webpackConfig,

            function (err, stats) {
                if (err) {
                    throw new gutil.PluginError('webpack', err);
                }
            }
        );
    }
}

module.exports = servers;
