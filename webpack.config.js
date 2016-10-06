var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    devtool: 'eval-source-map',

    entry: __dirname + "/client/js/main.js",
    output: {
        path: __dirname + "/public",
        filename: "bundle.js"
    },

    module: {
        loaders: [{
            test: /\.json$/,
            loader: "json"
        }, {
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        }, {
            test: /\.less$/,
            loader: ExtractTextPlugin.extract(
                'css?sourceMap!' +
                'less?sourceMap'
            )
        }, {
            test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/font-woff'
        }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/octet-stream'
        }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file'
        }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=image/svg+xml'
        }]
    },

    plugins: [
        new ExtractTextPlugin("style.css", {
            allChunks: true
        })
    ]
};