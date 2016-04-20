// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var useref = require('gulp-useref');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');

//clean up distro folder in settings
var del = require('del');

//run tasks in sequence
var runSequence = require('run-sequence');

//get gulp to spin up a server, to actually serve the page
var browserSync = require('browser-sync').create();

// Default Task 'scripts' is removed in favour of useref when build is run

gulp.task('default', function (callback) {
  runSequence(['sass','browserSync', 'watch'],
    callback
  )
})

// This task will be called by other tasks, baseDir is where the index.html is or root of server, programmer will setup sass gulp task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: ''
    },
  })
})

// Watch Files For Changes, the [] is the list of tasks that need to be completed before watch can run, .html reload added
gulp.task('watch', ['browserSync', 'sass'], function() {
	gulp.watch('styles/scss/*.scss', ['sass']);
// Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload); 
	gulp.watch('scripts/preprocessed/*.js', browserSync.reload);
});

// Lint Task - check script directory
gulp.task('lint', function() {
    return gulp.src('scripts/preprocessed/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass from styles scss dir, updated to work with browser-sync - will keep css updated whenever sass task is run
gulp.task('sass', function() {
    return gulp.src('styles/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('css'))
		.pipe(browserSync.reload({
		stream: true
		}));
});

// Concatenate & Minify JS, needs rename, replaced by useref
gulp.task('scripts', function() {
    return gulp.src('scripts/preprocessed/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('scripts'))
        .pipe(rename('all.min.js'))
        .pipe(uglify({ mangle: false })) //need mangle false, otherwise will break angularjs app
        .pipe(gulp.dest('scripts'));
});


//doesn't seem to be able to grab CDN sources in html, only local files, replaces scripts
gulp.task('useref', function(){
  return gulp.src('*.html')
    .pipe(useref())
    // Minifies only if it's a JavaScript file
    .pipe(gulpIf('*.js', uglify({ mangle: false })))
    .pipe(gulp.dest('distro'))
    // Minifies only if it's a CSS file
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('distro'))
});

var cache = require('gulp-cache');

gulp.task('images', function(){
  return gulp.src('images/original/**/*.+(png|jpg|jpeg|gif|svg)')
  // Caching images that ran through imagemin
  .pipe(cache(imagemin({
	  //interlaced to true for images
      interlaced: true
    })))
  .pipe(gulp.dest('images'))
});


//just copying over files, nothing to be done
gulp.task('fonts', function() {
  return gulp.src('fonts/backup/**/*')
  .pipe(gulp.dest('fonts'))
})

//deletes distro folder
gulp.task('clean:distro', function() {
  return del.sync('distro');
})


//copies files to new folder, compls sass opt imagess, useref won't work since js files are url, also no fonts currently
gulp.task('build', function (callback) {
  runSequence('clean:distro', 
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
})