'use strict';

const http = require('http');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const app = express();

const api = require('./api');

app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', api);

// 前端页面
app.use('/', express.static(path.join(__dirname, '../client/build')));
app.get('/*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// handle error 参数 next 不能省略
app.use((error, req, res, next) => {
  console.log(error);
  if (!res.finished) {
    res.status(500).send(error.message);
  }
});

const server = http.createServer(app);

module.exports = server;
