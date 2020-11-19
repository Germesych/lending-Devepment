//Поменять значение на нужное less или sass
let preprocessor = 'sass';

const { src, dest, parallel, series,watch, prependListener } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');

function browsersync (){
  browserSync.init({
    server: {baseDir: 'app/'},
    notify: false,
    // Если работаем без локальной сети, поставить false
    online: true
  })
}

//Работа с скриптами
function scripts(){
  return src([
    //Можно добавить еще файлов, они будут подключаться сверху в низ.
    // 'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
    'app/js/moduls.js',
    'app/js/app.js',
  ])
.pipe(concat('app.min.js'))
.pipe(uglify())//Сжатие скриптов
.pipe(dest('app/js/'))
.pipe(browserSync.stream())
}

function styles(){
  return src('app/sass/main.scss') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less" или "app/sass/main.scss"
  .pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
  .pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
  .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
  .pipe(cleancss(( { level: {1:{ specialComments: 0 } }/*, format: 'beautify'*/ } )))//Минификация css (чтоб не минимизировать, просто раскоменить фрормат)
  .pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
  .pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

//Работа с изображениями
function images(){
  return src('app/img-src/**/*') // Берём все изображения из папки источника
  .pipe(newer('app/img/')) //Куда закинуть после сжатия
  .pipe(imagemin()) // Сжимаем и оптимизируем изображеня
  .pipe(dest('app/img/')) //Куда закинуть после сжатия
}

//Очистить папку app/img/**/*
function cleanimg(){
  return del( 'app/img/**/*', {force: true} ) // Удаляем всё содержимое папки "app/images/dest/"
}

//Очистить папку
function cleandist(){
  return del( 'dist/**/*', {force: true} )
}
//Сборка проекта
function buildcopy(){
  return src([
    'app/css/**/*.min.css',
    'app/js/**/*.min.js',
    'app/img/**/*',
    'app/**/*.html',
    'app/fonts/*',
  ], {base: 'app'})
  .pipe(dest('dist'))
}


//Отслеживание измения в файлах
function startwatch(){
  watch('app/sass/**/*', styles);
  watch([
    'app/**/*.js',
    '!app/**/*.min.js', //Исвключаем его в отслеживании
  ], scripts);
  watch('app/**/*.html').on('change', browserSync.reload);//Тут уазываем файлы, при изменении которых нужна перезагрузка (пока это html)
  watch('app/img-src/**/*', images)
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспорт функции images() в таск images
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);

//То что будет выполняться сразу после запуска
exports.default = parallel(styles, scripts, browsersync, startwatch)