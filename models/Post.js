'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 数据结构：文章
const Post = new Schema({
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
  isFail: Boolean,
  wechatId: String,
  updateNumAt: Date,
  // 文章正文html代码
  content: String
}, { toJSON: { virtuals: true } });

Post.plugin(require('mongoose-timestamp'));

Post.virtual('profile', {
  ref: 'Profile',
  localField: 'msgBiz',
  foreignField: 'msgBiz',
  justOne: true
});

// 索引
Post.index({ publishAt: -1 });
Post.index({ publishAt: -1, msgIdx: 1 });
Post.index({ publishAt: 1 });
Post.index({ publishAt: 1, msgIdx: 1 });
Post.index({ updateNumAt: -1 });
Post.index({ updateNumAt: 1 });
Post.index({ msgBiz: 1 });
Post.index({ msgBiz: 1, publishAt: 1, msgIdx: 1 });

mongoose.model('Post', Post);
