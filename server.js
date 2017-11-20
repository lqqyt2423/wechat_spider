'use strict';
const http = require('http');
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

app.use('/api', data);

app.use('/wechat-data', express.static(path.join(__dirname, './client/build')));
app.get('/wechat-data/*', (req, res) => {
  res.sendFile(path.join(__dirname, './client/build/index.html'));
});

const server = http.createServer(app);

const io = require('socket.io')(server);

exports = module.exports = server;
exports.io = io;