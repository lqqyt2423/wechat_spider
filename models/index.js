'use strict';

const mongoose = require('mongoose');
const path = require('path');

mongoose.Promise = global.Promise;

// 载入 mongoose 插件
require('./plugins/paginator');

const config = require('../config');

mongoose.connect(config.mongodb.db);

mongoose.set('debug', false);

// Load All Models
[
  'Post',
  'Profile',
  'Category',
  'Comment'
].forEach(function(modelName) {
  require(path.join(__dirname, modelName));
  exports[modelName] = mongoose.model(modelName);
});
