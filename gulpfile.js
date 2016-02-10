// Based on https://github.com/shakyShane/jekyll-gulp-sass-browser-sync/blob/master/gulpfile.js
var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var cp = require('child_process');
var replace = require('gulp-replace');

var messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
  browserSync.notify(messages.jekyllBuild);
  return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
    .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
  browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function () {
  browserSync({
    server: {
      baseDir: '_site'
    }
  });
});

/**
 * Compile files from style.scss into _site/css (for live injecting)
 */
gulp.task('sass', function () {
  return gulp.src('style.scss')
    .pipe(replace('---', ''))
    .pipe(sass({
      includePaths: ['_sass'],
      onError: browserSync.notify
    }))
    .pipe(gulp.dest('_site'))
    .pipe(browserSync.reload({stream: true}));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
  gulp.watch(['_sass/**/*.{scss,sass}', 'style.scss'], ['sass']);
  gulp.watch([
    '_includes/**/*',
    '_layouts/**/*',
    '_posts/**/*',
    'images/**/*',
    'blog/**/*',
    '_config.yml',
    '*.{html,md}'
  ], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);