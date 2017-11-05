'use strict';

require('./connect');
const mongoose = require('mongoose');

// 数据结构：公众号账号
const Category = new mongoose.Schema({
  name: String,
  msgBizs: [String]
}, { toJSON: { virtuals: true } });

Category.plugin(require('mongoose-timestamp'));

Category.virtual('profiles', {
  ref: 'Profile',
  localField: 'msgBizs',
  foreignField: 'msgBiz'
});

module.exports = mongoose.model('Category', Category);
