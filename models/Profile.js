'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const debug = require('../utils/debug')('Profile');

// 数据结构：公众号账号
const Profile = new Schema({
  // 公众号标题 name
  title: String,
  // 公众号 id
  wechatId: String,
  // 公众号介绍
  desc: String,
  // 公众号标志
  msgBiz: String,
  // 公众号头像
  headimg: String,
  // 上次打开历史页面的时间
  openHistoryPageAt: Date,

  // 省份
  province: String,
  // 城市
  city: String,

  // 发布的第一篇文章的发布当天 0 点的时间
  firstPublishAt: Date,

  // 无关的字段，可忽略
  property: String,
});

Profile.plugin(require('motime'));

Profile.index({ msgBiz: 1 }, { unique: true });

// log profile info by find msgBiz
Profile.statics.logInfo = async function(msgBiz) {
  if (!msgBiz) return;
  let title;
  const profile = await this.findOne({ msgBiz });
  if (profile && profile.title) title = profile.title;
  let arr = ['msgBiz', msgBiz];
  if (title) arr = arr.concat(['title', title]);
  debug(...arr);
};

// debug info
Profile.statics.debugInfo = function(profiles) {
  if (!Array.isArray(profiles)) profiles = [profiles];
  profiles.forEach(profile => {
    debug('id', profile.id);
    debug('名称', profile.title);
    debug('msgBiz', profile.msgBiz);
    debug();
  });
};

// 插入或更新数据
// 必须包含 msgBiz
Profile.statics.upsert = async function(profile) {
  if (Array.isArray(profile)) {
    return Promise.all(profile.map(this.upsert.bind(this)));
  }
  const { msgBiz } = profile;
  if (!msgBiz) return null;
  return this.findOneAndUpdate(
    { msgBiz },
    profile,
    { upsert: true, new: true }
  );
};

mongoose.model('Profile', Profile);
