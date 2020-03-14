'use strict';

const mongoose = require('mongoose');
const path = require('path');
const logger = require('../utils/logger');

mongoose.Promise = global.Promise;

// 载入 mongoose 插件
require('./plugins/paginator');

const config = require('../config');

mongoose.connect(config.mongodb.db, (err) => {
  if (err) {
    logger.warn('connect to mongodb failed');
    logger.error(err);
    process.exit(1);
  }
});

if (config.isProd) mongoose.set('debug', false);
if (config.isDev) mongoose.set('debug', true);

// Load All Models
[
  'Post',
  'Profile',
  'Comment',
  'ProfilePubRecord',
].forEach(function (modelName) {
  require(path.join(__dirname, modelName));
  exports[modelName] = mongoose.model(modelName);
});
