'use strict';

const models = require('../models');
const redis = require('../utils/redis');
const config = require('../config');

const {
  rule: ruleConfig,
  redis: redisConfig,
} = config;

// 链接数组的缓存
// POST_LIST_KEY: 初始跳转规则，优先级低，且每次程序重启会清空
const { POST_LIST_KEY } = redisConfig;

const {
  page: pageConfig,
} = ruleConfig;

// 获取下一个文章跳转链接
async function getNextPostLink() {
  let nextLink;

  // 提取缓存中的跳转链接
  nextLink = await redis('lpop', POST_LIST_KEY);
  if (nextLink) return nextLink;

  // 没有拿到链接则从数据库中查
  const { minTime, maxTime, isCrawlExist, targetBiz, crawlExistInterval } = pageConfig;

  const searchQuery = {
    isFail: null,
    link: { $exists: true },
    $or: [
      { publishAt: { $gte: minTime, $lte: maxTime } },
      { publishAt: null },
    ],
  };

  if (targetBiz && targetBiz.length > 0) searchQuery.msgBiz = { $in: targetBiz };

  if (!isCrawlExist) searchQuery.updateNumAt = null;

  const links = await models.Post.find(searchQuery).select('link publishAt updateNumAt').then(posts => {
    if (!(posts && posts.length > 0)) return [];

    // 根据config中的是否抓取已经抓去过的文章来判断逻辑
    if (!isCrawlExist) {
      return posts.map(post => post.link);
    } else {
      return posts.filter(post => {
        const { publishAt, updateNumAt } = post;
        if (!updateNumAt) return true;
        if (!publishAt) return true;
        if (new Date(updateNumAt).getTime() - new Date(publishAt).getTime() > crawlExistInterval) {
          return false;
        } else {
          return true;
        }
      }).map(post => post.link);
    }
  });

  // 如果还查不到 则证明已经抓取完毕了 返回undefined
  if (links.length === 0) return;

  // 将从数据库中查到的链接放入redis中
  await redis('rpush', POST_LIST_KEY, links);

  // 再查一次就有下一个链接了
  return getNextPostLink();
}

// 判断是否是微信文章页面
function isPostPage(link) {
  const isPost = /mp\.weixin\.qq\.com\/s\?__biz/.test(link);
  const isOldPost = /mp\/appmsg\/show/.test(link);
  const isShortLink = /mp\.weixin\.qq\.com\/s\/(\w|-){22}/.test(link);
  if (isPost || isOldPost || isShortLink) return true;
  return false;
}

// 返回剩余文章抓取长度的 debug 信息
async function debugInfo() {
  const len = await redis('llen', POST_LIST_KEY);
  return `剩余文章抓取长度: ${len}`;
}

module.exports = {
  getNextPostLink,
  isPostPage,
  debugInfo,
};
