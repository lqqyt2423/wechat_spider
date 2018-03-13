'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 数据结构：公众号账号
const Profile = new Schema({
  title: String,
  wechatId: String,
  desc: String,
  msgBiz: String,
  headimg: String,
  openHistoryPageAt: Date,
  // 无关的字段，可忽略
  property: String
});

Profile.plugin(require('mongoose-timestamp'));

mongoose.model('Profile', Profile);
