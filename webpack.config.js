/*
    *@description 构建模式配置
*/

'use strict';

const path = require('path');
const fs   = require('fs');

const config = require('./config.json');
const distPath = config.path.dist + '/';

var nameStr = '[name].[hash:6]';
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var extractLESS = new ExtractTextPlugin('css/[name].[chunkhash:6].css');

var MapPlugin = require('map-webpack-plugin');
var mapPluginInstance = new MapPlugin({
    filename:'map.json',
    path: path.resolve(__dirname, config.mapPath || distPath+"map")
});

var CacheUglifyjsWebpackPlugin = require('cache-uglifyjs-webpack-plugin');
var cacheJsPlugin = new CacheUglifyjsWebpackPlugin({
    cacheDirectory: '../temp',//缓存目录
    compress: {
        warnings: false
    }
});


module.exports = {
  //devtool: "source-map",    //生成sourcemap,便于开发调试
  output: {
      //path: path.join(__dirname, distPath),//文件输出目录
      //publicPath: distPath,//用于配置文件发布路径，如CDN或本地服务器
      publicPath: "../",
      filename: "js/[name].[chunkhash:6].js"      //根据入口文件输出的对应多个文件名
  },
  module: {
    //各种加载器，即让各种文件格式可用require引用
    loaders: [
      // { test: /\.css$/, loader: "style-loader!css-loader"},
        {
          test: /\.(less|css)$/,
          loader: extractLESS.extract(
              'css?-autoprefixer&sourceMap!'+  /* 这里要加入　-autoprefixer　这个表示不要移除浏览器前缀（-webkit-）的样式，默认在压缩的时候会去掉前缀相关的样式　　详情查看 https://github.com/webpack/css-loader */
              'autoprefixer?browsers=last 6 versions!'+
              'less?sourceMap'
          )
        },
        {
            test: /\.(jpg|png|gif)$/,
            loader: "url?limit=8192&name=img/[folder]/"+ nameStr+".[ext]"+"!img?minimize&progressive=true&optimizationLevel=5"
        },
        {
            test: /\.(eot|svg|ttf|woff)$/,
            loader: "file?name=fonts/"+ nameStr +".[ext]"
        },
        {
            test: /\.jsx?$/,
            loader: "babel",
            query: {
              presets: ['react', 'es2015'],
              cacheDirectory: '../temp'
            }
        }
    ]
  },

  resolve: {
    //配置别名，在项目中可缩减引用路径
    alias: {},
    extensions:["",".js",".jsx"],
    root:[
        /*
            配置查找模块路径
            比如 require('react')  这个时候没有设置相对路径，就会跑到设置的路径里面去查询
            这里主要是针对核心文件的处理
            当然如果是这样的文件不多  也可以通过设置alias来实现
        */
        path.resolve('./src/js/vendor')
    ]
  },
  externals:{
      'react':'React',
      'react-dom':'ReactDOM'
  },
  plugins: [
      extractLESS,
      mapPluginInstance,
      cacheJsPlugin,
      new webpack.DefinePlugin({
        'process.env':{
            'NODE_ENV': JSON.stringify('production')
        }
      }),
    //   ,new webpack.optimize.CommonsChunkPlugin({
    //       name: 'common',
    //       filename: 'js/'+ nameStr +'.js'
    //   })
  ]
};
