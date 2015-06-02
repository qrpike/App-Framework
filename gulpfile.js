

// Required Modules:
var gulp 		= require('gulp');
var runSequence 	= require('gulp-run-sequence');
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
var stylish 	= require('jshint-stylish');
var jshint 		= require('gulp-jshint');
var htmlreplace 	= require('gulp-html-replace');
var del 		= require('del');
var imagemin 	= require('gulp-imagemin');



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

// Injected prod variables: window._appconfig will equal the following:
const APP_CONFIG_INJECTION = {
	API_URL: 'https://api.domain.com'
}

// Where we should be putting the dev/prod files:
var DEST_DIR = "./app" // This gets changed in the build task..
var PROD = false; // This gets changed in the build task..


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



// Production build of the app:
gulp.task('build', function(cb) {
  runSequence('config-build', 'clean', ['lint', 'htmlreplace', 'less', 'bundle-vendor', 'bundle-app']);
});
// gulp.task('build', ['config-build']);
gulp.task('config-build', function( cb ){
	// Change options for Prod Build settings:
	DEST_DIR = "./build";
	PROD = true;
	cb();
});



// Clean the build dir so we can do a clean build:
gulp.task('clean', function( cb ){
    del([ DEST_DIR ], cb);
});



// Copy all static images, and optimize them:
gulp.task('images', function() {
  return gulp.src([
  		'./app/images/**/*'
  	])
    // Pass in options to the task
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest(DEST_DIR+'/img'));
});



// Lint / JShint your Javascript:
gulp.task('lint', function(){
	return gulp.src([
			'./app/js/**/*.js',
			// Dont lint the bundled files:
			'!./app/js/bundles/**/*.js'
		])
		.pipe(jshint())
		// Print results:
		.pipe(jshint.reporter( stylish ))
		// Fail on error, Stop build process if needed:
		.pipe(jshint.reporter('fail'));
});



// HTML Replace if needed:
// Be careful not to htmlreplace your src index.html
gulp.task('htmlreplace', function() {
	return gulp.src('./app/index.html')
		.pipe(htmlreplace({
			'conf': "<script>"+
				"window._appconfig = " + JSON.stringify(APP_CONFIG_INJECTION)+
				"</script>"
		}))
		.pipe(gulp.dest(DEST_DIR));
});



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
	if(PROD){
		stream = stream
			.pipe(minifyCSS());

	// If dev mode:
	}else{
		// sourcemap LESS files, easy debugging:
		stream = stream
			.pipe(sourcemaps.write('.'));
	}
	
	return stream
		.pipe(gulp.dest(DEST_DIR+'/style/css/'))
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
		debug : !PROD,
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

	if(PROD){
		stream = stream.pipe(size(SIZE_OPTS))
			.pipe(uglify())
			.pipe(size(SIZE_OPTS));
	}

	return stream.pipe(gulp.dest(DEST_DIR+'/js/bundles/'))
		.pipe(reload({stream: true}));

});



// Bundle all the Vendor/3rd Party files:
gulp.task("bundle-vendor", function(){

	var b = browserify({
		debug : !PROD,
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

	if(PROD){
		stream = stream.pipe(size(SIZE_OPTS))
			.pipe(uglify())
			.pipe(size(SIZE_OPTS));
	}

	return stream.pipe(gulp.dest(DEST_DIR+'/js/bundles/'));

});


