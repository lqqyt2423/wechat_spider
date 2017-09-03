const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const config = require('./config');
const app = express();

const data = require('./api/data');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', data);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;