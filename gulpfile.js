/*
    *@description: gulp  任务
*/
const path = require('path');
const gulp = require('gulp');
const watch = require('gulp-watch');

const webpack = require('gulp-webpack');
const fileinclude = require('gulp-file-include');
const named = require('vinyl-named');
const through2 = require('through2');
const ejs = require("gulp-ejs");

/*设置相关*/
const config = require('./config.json');
const srcDir = config.path.src;
const debugDir = config.path.debug;
const distDir = config.path.dist;
const htmlViews = config.htmlViews;
const appJsPath = config.appJsPath;
const coreJs = config.coreJs;

/*ejs 相关*/
const tool = require('./tool');
function reEjs(){
    return ejs({
        init_js: tool.init_js,
        init_css: tool.init_css,
        init_img: tool.init_img
    }).on('error',console.log);
}

/*webpack 配置相关*/
var configPro = require('./webpack.config');
var configDebugCtrl = require('./webpack.dev');
var configCore = require('./webpack.core');


/*源码相关-针对gulp 监听或者编译  凡是以_开头的文件或者以_开头的文件夹下的文件都不执行编译*/
const _htmlSrcPath = srcDir+'/html/';
const _htmlFile = [
    _htmlSrcPath+'*.html',
    _htmlSrcPath+'**/*.html',
    `!${_htmlSrcPath}**/_*/*.html`,
    `!${_htmlSrcPath}**/_*.html`
];//html

const _jsSrcPath = srcDir+'/js/';
const _jsFile = [
    `${_jsSrcPath}/${appJsPath}/**/*.js?(x)`,
    `!${_jsSrcPath}**/_*/*.js?(x)`,
    `!${_jsSrcPath}**/_*.js?(x)`
];//js jsx

const _jsCoreFile = [`${_jsSrcPath}/vendor/*.js?(x)`];

/*编译html*/
function gulpHtml(env,cb){
    tool.setEnv(env);
    gulp.src(_htmlFile)
    .pipe(fileinclude('@@'))
    .pipe(reEjs())
    .pipe(gulp.dest(htmlViews))
    .on('end',()=>{
        console.log('html is finished!');

        cb && cb();
    });
}

/*监听html*/
gulp.task('html:dev',()=>{
    gulpHtml('local',()=>{
        // 监听html
        console.log('html is start watch!');
        //{events:['add', 'change']} 监听 新增、修改
        watch(_htmlFile,{events:['add', 'change']},(file)=>{
            console.log(file.path+' complite!');
        })
        .pipe(fileinclude('@@'))
        .pipe(reEjs())
        .pipe(gulp.dest(htmlViews));
    });

});

var jsWatchList = new Set();

/* 编译核心文件 */
gulp.task('core',()=>{
    var startTime = (new Date()).getTime();

    gulp.src(_jsCoreFile)
        .pipe(named(function(file){
            var _file = file.relative.replace(/\\/g,'/');
            _file = _file.replace(/\//g,'_');
            file.named  = path.basename(_file, path.extname(_file));

            this.queue(file);
        }))
        // .pipe(webpack(configCore('')))
        // .pipe(gulp.dest(debugDir+'/'))
        .pipe(webpack(configCore('www')))
        .pipe(gulp.dest(distDir+'/'))
        .on('end',function(){
            var endTime = (new Date()).getTime();
            console.log('corejs is finished!');
            console.log(`use time:${(endTime-startTime)/1000} s`);
        });
});

/*开发模式下构建和监听js*/
gulp.task('js:dev',()=>{
    gulp.src(_jsFile)
    .pipe(watch(_jsFile,{events:['add', 'change']},(file)=>{
        if(jsWatchList.has(file.path)){
            return false;
        }else{
            jsWatchList.add(file.path);
            gulp.src(file.path)
                .pipe(webpack(configDebugCtrl(file.relative)))
                .pipe(gulp.dest(debugDir+'/'))
                .on('end',()=>{
                    console.log(file.relative+' is complite!');
                });
        }

    }))
    ;
});


/*dev环境编译执行*/
gulp.task('dev',['html:dev','js:dev']);


/*生产环境编译执行*/
gulp.task('build',()=>{
    var startTime = (new Date()).getTime();
    gulp.src(_jsFile)
        .pipe(named(function(file){
            var _file = file.relative.replace(/\\/g,'/');
            _file = _file.replace(/\//g,'-');
            file.named  = path.basename(_file, path.extname(_file));

            this.queue(file);
        }))
        .pipe(webpack(configPro))
        .pipe(gulp.dest(distDir+'/'))
        .on('end',function(){
            var endTime = (new Date()).getTime();
            console.log('js is finished!');

            //构建html
            gulpHtml('www',()=>{
                console.log(`use time:${(endTime-startTime)/1000} s`);
            });

        });
});
