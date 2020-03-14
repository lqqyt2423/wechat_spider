'use strict';

const url = require('url');
const moment = require('moment');
const models = require('../models');
const logger = require('../utils/logger');
const redis = require('../utils/redis');
const config = require('../config');
const helper = require('../utils/helper');
const ContentHandler = require('../utils/contentHandler');

const {
  redis: redisConfig,
  rule: ruleConfig,
} = config;

const {
  page: pageConfig,
} = ruleConfig;

// 链接数组的缓存 每次重启程序后都会清空
const { PROFILE_LIST_KEY } = redisConfig;

// 性能较好的查询公众号数据库
class FindProfileHandler {
  constructor() {
    this.profileMap = new Map();
    this.profileWaitingMap = new Map();
  }

  async find(biz) {
    let doc = this.profileMap.get(biz);
    if (doc || doc === null) return doc;

    let waitingList = this.profileWaitingMap.get(biz);
    if (!waitingList) {
      // 首次
      waitingList = [];
      this.profileWaitingMap.set(biz, waitingList);

      doc = await models.Profile.findOne({ msgBiz: biz });
      if (!doc) doc = null;
      this.profileMap.set(biz, doc);

      // trigger
      for (const triggerFn of waitingList) {
        triggerFn(doc);
      }

      this.profileWaitingMap.delete(biz);

      return doc;
    } else {
      return await new Promise(resolve => {
        const triggerFn = doc => resolve(doc);
        waitingList.push(triggerFn);
        // logger.debug('[waitingList] len: %s', waitingList.length);
      });
    }
  }
}

// 存文章基本信息至数据库
async function savePostsData(postList) {
  const posts = [];
  postList.forEach(post => {
    const appMsg = post.app_msg_ext_info;
    if (!appMsg) return;
    const publishAt = new Date(post.comm_msg_info.datetime * 1000);
    posts.push({ appMsg, publishAt });

    const multiAppMsg = appMsg.multi_app_msg_item_list;
    if (!(multiAppMsg && multiAppMsg.length > 0)) return;
    multiAppMsg.forEach(appMsg => {
      posts.push({ appMsg, publishAt });
    });
  });

  // 查找 profile 辅助方法
  const findProfileHandler = new FindProfileHandler();

  let savedPosts = await Promise.all(posts.map(async post => {
    const { appMsg, publishAt } = post;
    let { title, content_url: link } = appMsg;
    if (!(title && link)) return;

    link = helper.escape2Html(link);
    title = helper.escape2Html(title);

    const urlObj = url.parse(link, true);
    const { query } = urlObj;
    const { __biz, mid, idx } = query;
    const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];

    const { cover, digest, source_url: sourceUrl, author, copyright_stat: copyrightStat } = appMsg;

    const updateQuery = { $set: { title, link, publishAt, cover, digest, sourceUrl, author, copyrightStat } };

    return models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      updateQuery,
      { new: true, upsert: true }
    );
  }));

  savedPosts = savedPosts.filter(p => p);

  if (savedPosts.length) {
    const profile = await findProfileHandler.find(savedPosts[0].msgBiz);
    if (profile && profile.title) {
      logger.info('[profile] msgBiz: %s, title: %s', savedPosts[0].msgBiz, profile.title);
    }
  }

  savedPosts.forEach(post => {
    logger.info('[抓取历史文章] 发布时间: %s, 标题: %s', post.publishAt ? moment(post.publishAt).format('YYYY-MM-DD HH:mm') : '', post.title);
  });

  // 记录公众号的发布记录
  await models.ProfilePubRecord.savePubRecords(savedPosts);

  await redis('llen', PROFILE_LIST_KEY).then(len => {
    logger.info('剩余公众号抓取长度: %s', len);
  });

  return savedPosts;
}


// link 必传
// body 可不传
async function getPostDetail(link, body) {

  if (!link) return;
  const ch = new ContentHandler({ link, body });

  const doc = await ch.getDetail();
  if (!doc) {
    logger.warn('[getPostDetail] can not get identify, link: %s', link);
    return;
  }

  const { msgBiz, msgMid, msgIdx } = doc;

  if (doc.isFail) {
    await models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { isFail: true },
      { upsert: true }
    );
    return;
  }

  const {
    wechatId,
    username,
    title,
    publishAt,
    sourceUrl,
    cover,
    digest,
    headimg,
    nickname,
  } = doc;

  {
    const updateObj = { msgBiz, msgMid, msgIdx, link };
    if (title) updateObj.title = title;
    if (wechatId) updateObj.wechatId = wechatId;
    if (publishAt) updateObj.publishAt = publishAt;
    if (sourceUrl) updateObj.sourceUrl = sourceUrl;
    if (cover) updateObj.cover = cover;
    if (digest) updateObj.digest = digest;

    await models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { $set: updateObj },
      { upsert: true }
    );
    logger.info('[save post basic info] %s %s %s %s', msgBiz, msgMid, msgIdx, title);
  }

  {
    const updateObj = { msgBiz };
    if (nickname) updateObj.title = nickname;
    if (wechatId) updateObj.wechatId = wechatId;
    if (username) updateObj.username = username;
    if (headimg) updateObj.headimg = headimg;
    await models.Profile.findOneAndUpdate(
      { msgBiz },
      { $set: updateObj },
      { upsert: true }
    );
    logger.info('[save profile basic info from post] %s %s %s %s %s', msgBiz, nickname, wechatId, username, headimg);
  }

  // 保存正文内容
  if (pageConfig.isSavePostContent) {
    let content, html;

    if (pageConfig.saveContentType === 'html') {
      html = await ch.toHtml();
      content = await ch.toText();
    } else {
      content = await ch.toText();
    }

    if (content || html) {
      const updateObj = { msgBiz, msgMid, msgIdx };
      if (content) updateObj.content = content;
      if (html) updateObj.html = html;
      await models.Post.findOneAndUpdate(
        { msgBiz, msgMid, msgIdx },
        { $set: updateObj },
        { upsert: true }
      );
      logger.info('[save post content] %s %s %s %s', msgBiz, msgMid, msgIdx, title);
    }
  }
}

async function upsertPosts(posts) {
  if (!posts) return;
  let isArray = Array.isArray(posts);
  if (!isArray) posts = [posts];

  const res = await Promise.all(posts.map(async post => {
    const { msgBiz, msgMid, msgIdx } = post;
    if (!msgBiz || !msgMid || !msgIdx) return null;

    const updateQuery = { $set: post };

    return await models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      updateQuery,
      { new: true, upsert: true }
    );
  }));

  if (isArray) return res;
  return res[0];
}

exports = module.exports = savePostsData;
exports.getPostDetail = getPostDetail;
exports.FindProfileHandler = FindProfileHandler;
exports.upsertPosts = upsertPosts;
