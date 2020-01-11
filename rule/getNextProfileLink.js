'use strict';

// 获取下一个抓取历史记录的页面地址

const moment = require('moment');
const redis = require('../utils/redis');
const config = require('../config');
const models = require('../models');

// 配置抓取方式
const RULE_FN = normalMode;
const CACHE_LIMIT = 100;

const {
  rule: ruleConfig,
  redis: redisConfig,
} = config;
const { profile: profileConfig } = ruleConfig;
const { PROFILE_LIST_KEY } = redisConfig;


// 正常模式
async function normalMode() {
  // 没有拿到链接则从数据库中查
  const { maxUpdatedAt, targetBiz } = profileConfig;

  const searchQuery = {
    msgBiz: { $exists: true },
    $or: [
      { openHistoryPageAt: { $lte: maxUpdatedAt } },
      { openHistoryPageAt: { $exists: false } }
    ]
  };

  if (targetBiz && targetBiz.length > 0) searchQuery.msgBiz = { $in: targetBiz };

  return await models.Profile.find(searchQuery)
    .sort('openHistoryPageAt')
    .select('msgBiz')
    .limit(CACHE_LIMIT)
    .then(profiles => {
      if (!(profiles && profiles.length > 0)) return [];
      const bizs = profiles.map(p => p.msgBiz);

      if (targetBiz && targetBiz.length) {
        // 按照目标 biz 排序
        bizs.sort((a, b) => {
          if (targetBiz.indexOf(a) <= targetBiz.indexOf(b)) return -1;
          return 1;
        });
      }

      return bizs;
    });
}

// 更新模式

// 理想中的采集规则：
// 1. 当天已经发布过文章的公众号当天就不在采集列表中了，除了每天可以发多次的号之外，需要每天的发布频率、最新一次发布时间等字段
// 2. 需要做到稍微智能些，根据平均发布时间、平均发布间隔、上次打开历史页面的时间等预测将要抓取的公众号列表

// 先只实现上述规则1
async function updateMode() {
  const today = moment().startOf('day').toDate();
  const query = {
    msgBiz: { $exists: true },
    $or: [
      { maxDayPubCount: { $gt: 1 } },
      { latestPublishAt: { $lt: today } },
      { latestPublishAt: { $exists: false } },
    ]
  };
  const profiles = await models.Profile.find(query).sort('openHistoryPageAt')
    .select('msgBiz')
    .limit(CACHE_LIMIT);
  if (!profiles.length) return [];
  return profiles.map(p => p.msgBiz);
}

async function getNextProfileLink() {
  let nextLink = await redis('lpop', PROFILE_LIST_KEY);
  if (nextLink) return nextLink;

  const bizs = await RULE_FN();
  if (bizs.length === 0) return;

  const links = bizs.map(bizToLink);

  // 将从数据库中查到的链接放入redis中
  await redis('rpush', PROFILE_LIST_KEY, links);

  // 再查一次就有下一个链接了
  return await getNextProfileLink();
}

exports = module.exports = getNextProfileLink;

// 必须有一个链接返回
exports.must = async function () {
  const link = await getNextProfileLink();
  if (link) return link;
  return bizToLink('MjM5ODIyMTE0MA==');
};

function bizToLink(biz) {
  return `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${biz}&scene=124#wechat_redirect`;
}
