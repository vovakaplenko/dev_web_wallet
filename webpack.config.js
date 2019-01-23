var path=require('path');
var webpack = require('webpack');
const Uglify = require("uglifyjs-webpack-plugin");
module.exports = {
    entry: {
        router: './frontend/router.js',
       eulaandtc: './frontend/eulaandtc.js'
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.common.js',
            jquery: 'jquery/src/jquery.js'
        }
    },
    output: {
        path: path.resolve('.')+'/public/js/',
        filename: '[name]_bundle.js'
    },
    plugins: [
        new Uglify(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        })
    ],
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    // vue-loader options go here
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};
