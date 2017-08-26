'use strict';

require('./connect');
const mongoose = require('mongoose');

// 数据结构：文章
const Post = new mongoose.Schema({
  title: String,
  link: String,
  publishAt: Date,
  readNum: Number,
  likeNum: Number,
  msgBiz: String,
  msgMid: String,
  msgIdx: String,
  sourceUrl: String,
  cover: String,
  digest: String,
  isFail: Boolean
});

Post.plugin(require('mongoose-timestamp'));

module.exports = mongoose.model('Post', Post);
