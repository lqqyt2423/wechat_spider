'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const redis = require('../utils/redis');
const config = require('../config');
const debug = require('../utils/debug')('Profile');

const {
  rule: ruleConfig,
  redis: redisConfig,
} = config;

const { profile: profileConfig } = ruleConfig;

// 链接数组的缓存 每次重启程序后都会清空
const { PROFILE_LIST_KEY } = redisConfig;

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

// 获取下一个抓取历史记录的页面地址
// 公众号跳转链接放在redis中
Profile.statics.getNextProfileLink = async function() {
  // 先从redis中取链接
  let nextLink = await redis('lpop', PROFILE_LIST_KEY);
  if (nextLink) return nextLink;

  // 没有拿到链接则从数据库中查
  const { maxUpdatedAt, targetBiz } = profileConfig;

  const searchQuery = {
    $or: [
      { openHistoryPageAt: { $lte: maxUpdatedAt } },
      { openHistoryPageAt: { $exists: false } }
    ]
  };

  if (targetBiz && targetBiz.length > 0) searchQuery.msgBiz = { $in: targetBiz };

  const links = await this.find(searchQuery).select('msgBiz').then(profiles => {
    if (!(profiles && profiles.length > 0)) return [];
    let tmpProfiles = profiles.map(profile => {
      const link = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${profile.msgBiz}&scene=124#wechat_redirect`;
      const msgBiz = profile.msgBiz;
      return { link, msgBiz };
    });

    if (targetBiz && targetBiz.length) {
      // 按照目标 biz 排序
      tmpProfiles.sort((a, b) => {
        if (targetBiz.indexOf(a.msgBiz) <= targetBiz.indexOf(b.msgBiz)) return -1;
        return 1;
      });
    }

    return tmpProfiles.map(p => p.link);
  });

  // 如果还查不到 则证明已经抓取完毕了 返回undefined
  if (links.length === 0) return;

  // 将从数据库中查到的链接放入redis中
  await redis('rpush', PROFILE_LIST_KEY, links);

  // 再查一次就有下一个链接了
  return this.getNextProfileLink();
};

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
