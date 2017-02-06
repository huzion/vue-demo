
/**
* @description 基础工具
 */
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

var config = require('./config.json');
var _env = 'local';
var mapPath = config.mapPath;
var _srcPath = config['statics'][_env];

var Tools = {};

Tools.setEnv = function(str){
    _env = str || 'local';
    _srcPath = config['statics'][_env];
}

//获取文件json对象
Tools.getJSONSync = function(file) {
      var string;
      try{
          string = fs.readFileSync(file, 'utf8');
          return JSON.parse(string, true);
      }catch(e){
          return {};
      }

};

/**
 * 获取js/css/img的map
 * @type {srting}  css or js or img
 */

Tools.getMap = function(type) {
    var _map, _mapName, _mapPath, e, error;
    _map = {};
    _mapPath = path.join(__dirname, mapPath,'map.json');
    try {
        _map = Tools.getJSONSync(_mapPath);
    } catch (error) {
        e = error;
        console.log(e);
    }
    return _map[type];
};


//获取静态资源的路径
Tools.getStaticPath = function(type, isDebug) {
    //   var _distPath, _isDebug, _srcPath,_str;
    //   _isDebug = !!isDebug || false;
    //   _srcPath = "/debug" ;
    //   if(_env === 'local' || _isDebug){
    //       str = _srcPath;
    //   }else{
    //       str = '/dist';
    //   }

      return '//'+_srcPath+'/';
};

/**
 * 构造 css 资源路径
 * @param {string} cssList css列表
 * @example
 * cssList = 'main.css,index.css'
 * init_css(cssList)
 */

Tools.init_css = function(cssList, isDebug) {
      var _arr, _cssLinks, _cssMap, _cssPath, _isDebug, _timestamp;
      _isDebug = !!isDebug || false;
      _cssLinks = '';
      _cssMap = Tools.getMap('css');
      _cssPath = Tools.getStaticPath('css', _isDebug);
      _arr = cssList.split(',');
      _timestamp = String(new Date().getTime()).substr(0, 8);
      _arr.forEach(function(key) {
            var val;
            key = 'css/'+key;
            if(_env !== 'local' && !_isDebug && _.has(_cssMap, key)){
                val = _cssMap[key];
            }else{
                val =   key + "?t=" + _timestamp;
            }

            _cssLinks += "<link href='" + _cssPath + val + "' rel='stylesheet' type='text/css' />";
      });
      return _cssLinks ;
};


/**
 * 构造 js 资源路径
 * @param {string} jsList js列表
 * @example
 * jsList = 'sb.corelibs.js,sb.app_index.js,piwik.js'
 * init_js(jsList)
 */

Tools.init_js = function(jsList, isDebug) {
      var _arr, _buildDistLink, _buildSrcLink, _isDebug, _jsLinks, _jsMap, _jsPath, _reqJs, _timestamp;
      _isDebug = !!isDebug || false;
      _jsLinks = "";
      _jsMap = Tools.getMap('js');
      _jsPath = Tools.getStaticPath('js', _isDebug);
      _arr = jsList.split(',');
      _timestamp = String(new Date().getTime()).substr(0, 8);
      _reqJs = '';

      _arr.forEach(function(key) {
            var val;
            val = 'js/'+key;
            if (_env !== 'local' && !_isDebug && _.has(_jsMap, val) ) {
                val = _jsMap[val] ;
            } else {
                val = val + "?t=" + _timestamp;
            }


            _jsLinks += "<script src='" + _jsPath + val + "'></script>";
      });

      return _jsLinks;
};

//构造 img 资源路径
Tools.init_img = function(imgName, isDebug) {
      var _imgMap, _imgPath, _isDebug, _timestamp, _val;
      _isDebug = !!isDebug || false;
      _imgMap = Tools.getMap('img');
      _imgPath = Tools.getStaticPath('img', _isDebug);
      _timestamp = String(new Date().getTime()).substr(0, 8);
      imgName ='img/'+imgName;
      if(_env !== 'local' && !_isDebug && _.has(_imgMap, imgName)){
          _val = _imgMap[imgName];
      }else{
          _val = imgName + "?t=" + _timestamp
      }

      return  _imgPath + _val;
};

//压缩html
Tools.htmlMinify = function(source) {
  var s = source.replace(/\/\*([\s\S]*?)\*\//g, '')
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/^\s+$/g, '')
      .replace(/\n|\t|\r/g, '')
      .replace(/([\n]?\s)+/g, ' ')
      .replace(/>([\n\s]*?)</g, '><');
  return s;
};

module.exports = Tools;
