'use strict';

const http = require('http');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const app = express();
const spiderConfig = require('../config');
const Category = require('../models/Category');

const api = require('./api');

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', api);

// 接口设置抓取此分类内的账号
// curl localhost:8104/spider -XPOST -H "Content-Type: application/json" -d '{ "categoryId": "5a50cacbb7c8a46b635878c6" }'
app.post('/spider', async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) return next(new Error('请传入categoryId'));
    const category = await Category.findOne({ _id: categoryId });
    if (!category) return next(new Error('请传入正确的categoryId'));
    const msgBizs = category.msgBizs;
    if (!msgBizs.length) return next(new Error('请传入正确的categoryId'));
    spiderConfig.insertJsToNextProfile.targetBiz = msgBizs;
    spiderConfig.insertJsToNextPage.targetBiz = msgBizs;
    res.send('设置成功');
  } catch(e) {
    next(e);
  }
});

// 前端页面
app.use('/', express.static(path.join(__dirname, '../client/build')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// handle error 参数next 不能省略
app.use((error, req, res, next) => {
  if (!res.finished) {
    res.status(500).send(error.message);
  }
});

const server = http.createServer(app);

module.exports = server;
