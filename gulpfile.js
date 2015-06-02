

// Required Modules:
var gulp 		= require('gulp');
var path 		= require('path');
var less 		= require('gulp-less');
var concat 		= require('gulp-concat');
var gutil 		= require('gulp-util');
var browserSync = require('browser-sync');
var reload 		= browserSync.reload;
var size 		= require('gulp-size');
var uglify		= require('gulp-uglify');
var _ 			= require('underscore');
var buffer 		= require('vinyl-buffer');
var nodeResolve = require('resolve');
var browserify 	= require('browserify');
var source 		= require('vinyl-source-stream');
var minifyCSS 	= require('gulp-minify-css');
var karma 		= require('gulp-karma');
var autoprefixer 	= require('gulp-autoprefixer');
var sourcemaps 	= require('gulp-sourcemaps');

/*
	SETTINGS:
	-------------------------------------------------
*/

// These are the libs we need to bundle for our app ( seperately ):
const EXTERNAL_LIBS = [
	'jquery', 'underscore', 'backbone', 'moment', 'chart.js'
];

// Which files Karma should load:
const TEST_FILES = [
	'tests/**/*.test.js'	
];

// Logging info for builds:
const SIZE_OPTS = {
	showFiles: true,
	gzip: true
};

// Transforms Browserify should run:
const BROWSERIFY_TRANSFORMS = ["node-underscorify"];

// Our main App file ( root file ):
const APP_GLOB = "./app/js/app.js";






/*
	GULP TASKS:
	-------------------------------------------------
*/

// Start UI server after building the app:
gulp.task('default', ['less', 'bundle-vendor', 'bundle-app'], function() {
	// UI Server settings:
	browserSync({
		server: {
			baseDir: "./app/"
		},
		port: 3002
	});
	// Which files to watch for reloads:
	gulp.watch([
		"./app/*.html",
		"./app/css/*.css"
	]).on('change', reload);
	gulp.watch([
		"./app/js/**/*.js",
		'./app/js/**/*.html',
		"!./app/js/bundles/**/*.js"
	], ['build-app-lib']);
	gulp.watch([
		"./app/style/*.less",
		'./app/js/pages/**/*.less',
		'./app/js/components/**/*.less'
	], ['less']);
});


// Same as default just doesn't start browser sync ( used for deploys ):
gulp.task('build', ['less', 'build-common-lib', 'build-app-lib']);


// LESS Compilation
gulp.task('less', function (){
	var stream = gulp.src([
			'./app/style/site.less',
			'./app/js/pages/**/*.less',
			'./app/js/components/**/*.less'
		])
		.pipe(sourcemaps.init())
		.pipe(less({
			paths: [
				path.join(__dirname, './node_modules'),
				path.join(__dirname, './app/style')
			]
		}).on('error', gutil.log))
		.pipe(concat('site.css'));

	// If production, compress css:
	if(gulp.env.production){
		stream = stream
			.pipe(minifyCSS());

	// If dev mode:
	}else{
		// sourcemap LESS files, easy debugging:
		stream = stream
			.pipe(sourcemaps.write('.'));
	}
	
	return stream
		.pipe(gulp.dest('./app/style/css/'))
		.pipe(reload({stream: true}));
});


// Run Karma tests on this app:
gulp.task('test', function(){
	return gulp.src(TEST_FILES)
		.pipe(karma({
			configFile: 'local.karma.conf.js',
			action: 'run'
		}))
		.on('error', function(err) {
			throw err;
		});
});


// Bundle all the app specific JS files:
gulp.task('bundle-app', function(){
	var b = browserify( APP_GLOB, {
		debug : !gulp.env.production,
		transform: BROWSERIFY_TRANSFORMS,
		paths: [
			path.join(__dirname, './app/js'),
			path.join(__dirname, './app'),
			path.join(__dirname, './app/js/lib')
		]
	});
	EXTERNAL_LIBS.forEach(function (id){
		b.external(id);
	});
	var stream = b.bundle()
		.pipe(source('app.js'))
		.pipe(buffer());

	if(gulp.env.production){
		stream = stream.pipe(size(SIZE_OPTS))
			.pipe(uglify())
			.pipe(size(SIZE_OPTS));
	}

	return stream.pipe(gulp.dest('./app/js/bundles/'))
		.pipe(reload({stream: true}));

});


// Bundle all the Vendor/3rd Party files:
gulp.task("bundle-vendor", function(){

	var b = browserify({
		debug : !gulp.env.production,
		paths: [
			path.join(__dirname, './app/js'),
			path.join(__dirname, './app'),
			path.join(__dirname, './app/js/lib')
		]
	});

	EXTERNAL_LIBS.forEach(function (id){
		console.log('Bundling:', id);
		b.require(nodeResolve.sync(id), { expose: id });
	});

	var stream = b.bundle()
		.pipe(source('vendor.js'))
		.pipe(buffer());

	if(gulp.env.production){
		stream = stream.pipe(size(SIZE_OPTS))
			.pipe(uglify())
			.pipe(size(SIZE_OPTS));
	}

	return stream.pipe(gulp.dest('./app/js/bundles/'));

});


