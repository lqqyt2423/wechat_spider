'use strict';

const express = require('express');
const merge = require('../../utils/merge');
const wrap = require('../wrap');
const config = require('../../config');

const api = express();

// get config
api.get('/', wrap(async (req, res) => {
  res.json({ data: config });
}));

// update config
api.put('/', wrap(async (req, res) => {
  const body = req.body;
  merge(config, body);
  res.json({ state: 1, message: '更新配置成功' });
}));

module.exports = api;
