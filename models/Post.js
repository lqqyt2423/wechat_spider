'use strict';

const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('../utils/logger');

// 数据结构：文章
const Post = new Schema({
  // 标题
  title: String,
  // 链接
  link: String,
  // 发布时间
  publishAt: Date,
  // 阅读数
  readNum: Number,
  // 点赞数
  likeNum: Number,
  // 在看数
  likeNum2: Number,
  // 公众号标志
  msgBiz: String,
  // 应该是每次发布的消息的标志
  msgMid: String,
  // 本次发布的条数顺序 首条、二条等等
  msgIdx: String,
  // 阅读原文链接
  sourceUrl: String,
  // 封面图片链接
  cover: String,
  // 摘要
  digest: String,
  // 作者
  author: String,
  // 11表示原创，普通文章应该值为100
  copyrightStat: Number,
  // 是否抓取失败：文章删除、其他未知原因
  isFail: Boolean,
  // 公众号 id
  wechatId: String,
  // 上次更新阅读数、点赞数的时间
  updateNumAt: Date,

  // 文章正文 纯文本
  content: String,
  // 文章正文 html
  html: String,
}, { toJSON: { virtuals: true } });

Post.plugin(require('motime'));

Post.virtual('profile', {
  ref: 'Profile',
  localField: 'msgBiz',
  foreignField: 'msgBiz',
  justOne: true
});

// 索引
Post.index({ publishAt: -1, msgIdx: 1 });
Post.index({ publishAt: 1, msgIdx: 1 });
Post.index({ updateNumAt: -1 });
Post.index({ msgBiz: 1, publishAt: 1, msgIdx: 1 });
Post.index({ msgBiz: 1, msgMid: 1, msgIdx: 1 }, { unique: true, sparse: true });
Post.index({ link: 1 });

// 插入或更新数据
// 必须包含 msgBiz, msgMid, msgIdx
Post.statics.upsert = async function (post) {
  if (Array.isArray(post)) {
    return Promise.all(post.map(this.upsert.bind(this)));
  }

  const { msgBiz, msgMid, msgIdx } = post;
  if (!msgBiz || !msgMid || !msgIdx) return null;
  return this.findOneAndUpdate(
    { msgBiz, msgMid, msgIdx },
    post,
    { upsert: true, new: true }
  );
};

// debug info
Post.statics.debugInfo = function (posts) {
  if (!Array.isArray(posts)) posts = [posts];
  posts.forEach(post => {
    logger.info('[post] id: %s, title: %s, publishAt: %s', post.id, post.title, post.publishAt ? moment(post.publishAt).format('YYYY-MM-DD HH:mm') : '');
  });
};

mongoose.model('Post', Post);
