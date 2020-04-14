'use strict';

//**************************************

// VARIABLES 

// index file name
var indexName = 'index' //default index
// Destination path variables.

var pathToCms = {
  js: 'dist/js',
  css: 'dist/css',
  media: 'dist/media',
  fonts: 'dist/fonts',
  img: 'dist/media',
  html: 'dist',
  indexHtml: `${indexName}.html`, // this path has to be in relation to the index.html file found in the dist folder
  devFiles: 'dist/dev_files'
}

//global variables

var vHost = 'vhost url here'; //eg: craft3.tag.test

//*************************************

var gulp = require('gulp');
const chmod = require('gulp-chmod');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var twig = require('gulp-twig');
var browserSync = require('browser-sync').create();
// var babel = require('gulp-babel');
// var order = require("gulp-order");
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');
var cache = require('gulp-cache');
var mode = require('gulp-mode')({
  modes: ["production", "development"],
  default: "development",
  verbose: false
});
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
const webpack2 = require('webpack');
const webpackStream = require('webpack-stream');
const named = require('vinyl-named');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
// const webpackConfig = require('./webpack.config.js');

//*************************************

let webpackConfig = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /.js$/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  }
}

gulp.task('scripts', function () {
  return gulp.src('dev/assets/_js/main.js')
    .pipe(plumber())
    .pipe(named())
    .pipe(sourcemaps.init())
    .pipe(webpackStream(webpackConfig, webpack2))
    .pipe((mode.production(uglify())))
    .pipe(sourcemaps.write())
    // 
    .pipe(rev())
    .pipe(gulp.dest(pathToCms.js))
    .pipe(rev.manifest())
    .pipe(gulp.dest(pathToCms.js))
    // 
    // .pipe(gulp.dest(pathToCms.js))
    .pipe(browserSync.reload({
      stream: true
    }))
})

gulp.task('copyScripts', function () {
  return gulp.src('dev/assets/_js/scripts/**/*.js')
    .pipe(gulp.dest(pathToCms.js + '/scripts'))
})


gulp.task('templates', function () {
  return gulp.src('dev/templates/**/*.html') // run the Twig template parser on all .html files in the "src" directory
    .pipe(twig())
    .pipe(gulp.dest(pathToCms.html)) // output the rendered HTML files to the "dist" directory
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('revRewrite', ['sass', 'scripts', 'copyHTML'], function () {
  console.log('runninr rewrite')
  const manifest = gulp.src(['dist/css/rev-manifest.json', 'dist/js/rev-manifest.json']);

  return gulp.src('dist/index.html')
    .pipe(revRewrite({ manifest }))
    .pipe(gulp.dest(pathToCms.html));
});

gulp.task('copyHTML', function () {
  return gulp.src('dev/templates/**/*.html')
    .pipe(gulp.dest(pathToCms.html))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('sass', function () {

  return gulp.src('dev/assets/_scss/main.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass()) // Using gulp-sass
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe((mode.production(cleanCSS())))
    .pipe(rev())
    .pipe(gulp.dest(pathToCms.css))
    .pipe(rev.manifest())
    .pipe(gulp.dest(pathToCms.css))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('copyFonts', function () {
  return gulp.src('dev/assets/fonts/**/*')
    .pipe(gulp.dest(pathToCms.fonts))
});

gulp.task('img', () =>
  gulp.src('dev/assets/img/**/*.+(png|jpg|gif|svg)')
    // .pipe(chmod(777))
    .pipe(gulp.dest(pathToCms.img))
    .pipe(browserSync.reload({
      stream: true
    }))
);

gulp.task('media', () =>
  gulp.src('dev/media/**/*.+(png|jpg|gif|svg)')
    .pipe((mode.production(imagemin([imageminMozjpeg(), imagemin.optipng()]))))
    .pipe(gulp.dest(pathToCms.media))
    .pipe(browserSync.reload({
      stream: true
    }))
);

gulp.task('clean', function () {
  return del.sync(['dist']);
});

gulp.task('cleanCss', function () {
  return del.sync(['dist/css/']);
});

gulp.task('browserSync', function () {
  browserSync.init({
    // baseDir: 'cms',
    // index: pathToCms.indexHtml
    proxy: vHost
    // host: vHost
  });
});


// Taks to run on command line

gulp.task('watch', ['clean', 'sass', 'scripts', 'copyScripts', 'img', 'media', 'copyFonts', 'copyHTML', 'revRewrite', 'browserSync'], function(){
  gulp.watch('dev/assets/_scss/**/*.+(css|scss|sass)', ['cleanCss','sass', 'copyHTML', 'revRewrite']);
  gulp.watch('dev/assets/_js/**/*.js', ['scripts', 'copyHTML' , 'revRewrite']);
  gulp.watch('dev/assets/img/**/*.+(png|jpg|gif|svg)', ['img']);
  gulp.watch('dev/assets/fonts/**/*.+(eot|svg|ttf|woff)')
  gulp.watch('cms/web/media/**/*.+(png|jpg|gif|svg|mp4)', ['media']);
  gulp.watch('dev/templates/**/*.html', ['copyHTML', 'revRewrite', 'revRewrite']);
});

gulp.task('build', ['clean', 'sass', 'scripts', 'copyScripts', 'img', 'media', 'copyHTML', 'copyFonts', 'revRewrite']);


// http://analyticl.com/blog/frontend-templating-with-gulp-and-twig-js