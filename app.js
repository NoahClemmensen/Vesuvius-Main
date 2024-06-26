var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts')
const DatabaseManager = require('./DatabaseManager');
var cors = require('cors');
const db = new DatabaseManager();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var panelRouter = require('./routes/panel');
var apiRouter = require('./routes/api');

var app = express();

// Set Templating Engine
app.use(expressLayouts);
app.use(cors());
app.set('layout', './layouts/full-width');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/panel', panelRouter);
app.use('/api', apiRouter.router);

// TODO: Add security middleware that checks for xss and sql injection

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error' , { title: 'Error' });
});

module.exports = app;
