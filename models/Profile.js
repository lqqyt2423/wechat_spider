'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const debug = require('debug')('ws:Profile');

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

Profile.plugin(require('motime'));

Profile.index({ msgBiz: 1 }, { unique: true });

// debug Profile
Profile.statics.logInfo = async function(msgBiz) {
  if (!msgBiz) return;
  let title;
  const profile = await this.findOne({ msgBiz });
  if (profile && profile.title) title = profile.title;
  let arr = ['msgBiz', msgBiz];
  if (title) arr = arr.concat(['title', title]);
  debug(...arr);
};

mongoose.model('Profile', Profile);
