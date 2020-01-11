'use strict';

const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('../utils/logger');

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
  // 原始id，示例：gh_70949f33590e
  // 关注二维码为：https://open.weixin.qq.com/qr/code?username=gh_70949f33590e
  username: String,
  // 上次打开历史页面的时间
  openHistoryPageAt: Date,

  // 省份
  province: String,
  // 城市
  city: String,

  // 发布的第一篇文章的发布当天 0 点的时间
  firstPublishAt: Date,
  // 最近一次的发布时间
  latestPublishAt: Date,
  // 每天的最大发布频率
  maxDayPubCount: { type: Number, default: 1 },

  // 无关的字段，可忽略
  property: String,
});

Profile.plugin(require('motime'));

Profile.index({ msgBiz: 1 }, { unique: true, sparse: true });

// log profile info by find msgBiz
Profile.statics.logInfo = async function (msgBiz) {
  if (!msgBiz) return;
  let title;
  const profile = await this.findOne({ msgBiz });
  if (profile && profile.title) title = profile.title;
  logger.info('[profile] msgBiz: %s, title: %s', msgBiz, title);
};

// debug info
Profile.statics.debugInfo = function (profiles) {
  if (!Array.isArray(profiles)) profiles = [profiles];
  profiles.forEach(profile => {
    logger.info('[profile] id: %s, msgBiz: %s, title: %s', profile.id, profile.msgBiz, profile.title);
  });
};

// 插入或更新数据
// 必须包含 msgBiz
Profile.statics.upsert = async function (profile) {
  if (Array.isArray(profile)) {
    return Promise.all(profile.map(this.upsert.bind(this)));
  }
  const { msgBiz } = profile;
  if (!msgBiz) return null;

  // 先通过 msgBiz 查找，再通过 title 查找
  let doc = await this.findOne({ msgBiz }).select('_id');
  if (!doc && profile.title) {
    doc = await this.findOne({ msgBiz: { $exists: false }, title: profile.title }).select('_id');
  }
  if (doc) {
    return await this.findByIdAndUpdate(doc.id, profile, { new: true });
  } else {
    return await this.create(profile);
  }
};

// 尝试更新最近一次的发布时间
Profile.statics.updateLatestPublishAt = async function (posts) {
  if (!posts || !posts.length) return;
  const msgBiz = posts[0].msgBiz;
  const profile = await this.findOne({ msgBiz });
  if (!profile) return;

  let latestPublishAt = posts[0].publishAt;
  posts.forEach(post => {
    if (post.publishAt > latestPublishAt) latestPublishAt = post.publishAt;
  });
  if (!profile.latestPublishAt || latestPublishAt > profile.latestPublishAt) {
    await this.findByIdAndUpdate(profile.id, { $set: { latestPublishAt } });
    logger.info('[profile updateLatestPublishAt] biz: %s, title: %s, at: %s', msgBiz, profile.title, moment(latestPublishAt).format('YYYY-MM-DD HH:mm'));
  }
};

// 计算 maxDayPubCount，从 ProfilePubRecord 同步
// 建议定时调用
Profile.statics.calcMaxDayPubCount = async function () {
  // 计算最近90天的值
  const compareDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
  const res = await mongoose.model('ProfilePubRecord').aggregate([
    { $match: { pubCount: { $gt: 1 }, date: { $gt: compareDate } } },
    { $group: { _id: '$msgBiz', maxDayPubCount: { $max: '$pubCount' } } }
  ]);
  if (res.length) {
    for (const item of res) {
      const { _id: msgBiz, maxDayPubCount } = item;
      await this.findOneAndUpdate({ msgBiz }, { $set: { maxDayPubCount } });
      logger.debug('[profile] set %s maxDayPubCount %s', msgBiz, maxDayPubCount);
    }

    const allMsgBizs = res.map(i => i._id);
    const result = await this.updateMany(
      { maxDayPubCount: { $gt: 1 }, msgBiz: { $nin: allMsgBizs } },
      { $set: { maxDayPubCount: 1 } }
    );
    logger.debug('[profile] 重置每天可发布多条的公众号: %s', result);
  }
};

mongoose.model('Profile', Profile);
