'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 数据结构：公众号账号
const Category = new Schema({
  name: String,
  msgBizs: [String]
}, { toJSON: { virtuals: true } });

Category.plugin(require('motime'));

Category.virtual('profiles', {
  ref: 'Profile',
  localField: 'msgBizs',
  foreignField: 'msgBiz'
});

mongoose.model('Category', Category);
