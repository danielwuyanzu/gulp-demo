const {src, dest, parallel, series, watch} = require('gulp');
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');
const csso = require('gulp-csso');
const imagemin = require('gulp-imagemin');

const merge = require('merge-stream');
const spritesmith = require('gulp.spritesmith');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const clean = require('gulp-clean')
const htmlmin = require('gulp-htmlmin')
const server = require('gulp-server-livereload');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const dist = 'dist'

function ignore(type) {
    return ['node_modules/**/*.', 'dist/**/*.'].map(i => i.concat(type))
}

function cleanDist() {
    return src(dist, {read: false, allowEmpty: true}).pipe(clean())
}

function js() {
    return src(['**/*.js'], {ignore: [...ignore('js'), 'gulpfile.js']}).pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(dist));
}

// function lib() {
//     return src(['lib/**/*.js'])
//         .pipe(uglify())
//         .pipe(dest(dist + '/lib'));
// }

function sprite() {
    // Generate our spritesheet
    const spriteData = src('images/icons/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css'
    }));

    // Pipe image stream through image optimizer and onto disk
    const imgStream = spriteData.img
        // DEV: We must buffer our stream into a Buffer for `imagemin`
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(dest('css/sprite'));

    // Pipe CSS stream through CSS optimizer and onto disk
    const cssStream = spriteData.css
        .pipe(csso())
        .pipe(dest('css/sprite'));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
}

function css() {
    // src(['css/**/*.css', '!sprite.css'])
    //     .pipe(autoprefixer({
    //         cascade: false,
    //         // overrideBrowserslist: ['ie > 7', 'ff > 3.4']
    //     }))
    //     .pipe(cleanCss())
    //     .pipe(dest(dist + '/css'))
    // src(['css/sprite/sprite.css'])
    //     .pipe(autoprefixer({
    //         cascade: false
    //     }))
    //     .pipe(cleanCss())
    //     .pipe(dest(dist + '/css/sprite'))
    //
    // return src('css/sprite/*.png').pipe(dest(dist + '/css/sprite'))
    return src(['**/*.css'], {ignore: ignore('css')})
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(cleanCss())
        .pipe(dest(dist))
}


function html() {
    return src(['**/*.html'], {ignore: ignore('html')}).pipe(htmlmin({collapseWhitespace: true})).pipe(dest(dist))
}

function others() {
    src(['api/*.json']).pipe(dest(dist + '/api'))
    return src(['lib/**/*.*'], {ignore: ['**/*.js', '**/*.css', '**/*.html']}).pipe(dest(dist + '/lib'))
}

function serve() {
    sprite()
    src('.')
        .pipe(server({
            livereload: {
                enable: true,
                filter: function (filePath, cb) {
                    cb(!(/node_modules/.test(filePath)));
                }
            }
        }));
}

exports.build = series(sprite, cleanDist, parallel(js, css, html, others))
exports.clean = cleanDist
exports.serve = serve
exports.js = js
exports.html = html
exports.css = css
exports.others = others
