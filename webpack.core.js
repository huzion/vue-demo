/*
    *@description 核心文件
*/

'use strict';

const path = require('path');
const fs   = require('fs');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var extractLESS = new ExtractTextPlugin('css/[name].css');
var webpack = require('webpack');

var cfg = {
  output: {
      publicPath: "../",
      filename: "js/[name].js"      //根据入口文件输出的对应多个文件名
  },
  module: {
    //各种加载器，即让各种文件格式可用require引用
    loaders: [
        {
            test: /\.css/,
            loader: extractLESS.extract(
                'css?sourceMap'
            )
        },
        {
            test: /\.jsx?$/,
            loader: "babel",
            exclude: /(node_modules)/,
            query: {
              presets: ['react', 'es2015'],
              cacheDirectory: '../temp'
            }
        }
    ]
  },
  plugins: [extractLESS],
  resolve: {
    extensions:["",".js",".jsx"],
  }
};

module.exports  = function (env){
    if(env === 'www'){
        //Webpack 提供了设置环境变量来优化代码的方案
        cfg.plugins.push(
            new webpack.DefinePlugin({
              'process.env':{
                'NODE_ENV': JSON.stringify('production')
              }
            })
        )

        //设置这个可以忽略压缩时产生的警告
        cfg.plugins.push(
            new webpack.optimize.UglifyJsPlugin({
              compress: {
                  warnings: false
              }
            })
        )
    }

    return cfg;
}
