var path = require('path');

module.exports = function(karma) {
  karma.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'browserify', 'chai-sinon'],

    // list of files / patterns to load in the browser
    files: [
      'tests/**/*.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tests/**/*.js': [ 'browserify' ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    // the JUnit reporter is meant for Jenkins integration
    // the Mocha reporter produces nicely structured output on the command line
    reporters: ['mocha'],

    // junitReporter : {
    //   outputFile: 'target/test-reports/KarmaTest.xml',
    //   suite: 'unit'
    // },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: karma.LOG_DISABLE || karma.LOG_ERROR || karma.LOG_WARN || karma.LOG_INFO || karma.LOG_DEBUG
    logLevel: karma.LOG_INFO,
    // logLevel: 'LOG_DEBUG',

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // 'Chrome', 'PhantomJS'
    browsers: ['PhantomJS'],

    browserify: {
      debug: true,
      transform: [ 'node-underscorify' ],
      paths: [
        path.join(__dirname, './app/js'),
        path.join(__dirname, './app'),
        path.join(__dirname, './app/js/lib')
      ]
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
