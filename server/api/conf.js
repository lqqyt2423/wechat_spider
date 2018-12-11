'use strict';

const express = require('express');
const fs = require('fs');
const util = require('util');
const path = require('path');
const merge = require('../../utils/merge');
const wrap = require('../wrap');
const config = require('../../config');
const { delCrawlLinkCache } = require('../../utils');

const api = express();
const writeFilePromise = util.promisify(fs.writeFile);

// get config
api.get('/', wrap(async (req, res) => {
  res.json({ data: config });
}));

// update config
api.put('/', wrap(async (req, res) => {
  const body = req.body;
  merge(config, body);
  // 本地存储
  await writeFilePromise(path.join(__dirname, '../../my_config.json'), JSON.stringify(config, null, 2));
  // 删除 redis 中缓存
  // TODO: 仅在符合更改条件的情况下删除
  await delCrawlLinkCache();
  res.json({ state: 1, message: '更新配置成功' });
}));

module.exports = api;
