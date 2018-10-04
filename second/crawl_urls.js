'use strict';

const url = require('url');
const {
  debugFn,
  sleep,
  sleepRandom,
  logCrawlHistory,
  shouldCrawl,
} = require('./utils');
const rp = require('request-promise');
const models = require('../models');
const config = require('../config');

const { mp: { cookie, token } } = config;

const debug = debugFn('crawl urls');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  Cookie: cookie,
};

function toUrl(uri, params) {
  const paramsArr = Object.keys(params).map(key => {
    return `${key}=${encodeURIComponent(params[key])}`;
  });
  return `${uri}?${paramsArr.join('&')}`;
}

async function getPosts(fakeid, page = 1, perPage = 5) {
  // 处理分页
  const count = perPage;
  const begin = (page - 1) * 5;

  const params = {
    lang: 'zh_CN',
    f: 'json',
    token,
    query: '',
    begin,
    count,
    type: 9,
    action: 'list_ex',
    fakeid,
  };
  const baseUri = 'https://mp.weixin.qq.com/cgi-bin/appmsg';
  const uri = toUrl(baseUri, params);

  if (!(await shouldCrawl(uri))) {
    debug(uri, '最近已经抓取过');
    return;
  }

  const res = await rp({
    uri,
    headers,
    json: true,
  });

  const { app_msg_cnt, base_resp } = res;
  if (base_resp.err_msg === 'freq control') {
    debug('Error', 'freq control');
    debug('睡眠 1 分钟再继续');
    await sleep(1000 * 60);
    return await getPosts(fakeid, page, perPage);
  }
  if (base_resp.err_msg !== 'ok') {
    throw new Error(`抓取错误: ${base_resp.err_msg}`);
  }

  const metadata = {
    count: app_msg_cnt,
    page,
    perPage,
    totalPage: Math.ceil(app_msg_cnt / perPage),
  };
  res.metadata = metadata;

  // log crawl uri
  await logCrawlHistory(uri);

  return res;
}

function handleRaw(raw) {
  const { app_msg_list, metadata  } = raw;

  const data = app_msg_list.map((rawPost) => {
    const { query: { __biz, mid, idx } } = url.parse(rawPost.link, true);
    const post = {
      title: rawPost.title,
      link: rawPost.link,
      publishAt: new Date(rawPost.update_time * 1000),
      msgBiz: String(__biz),
      msgMid: String(mid),
      msgIdx: String(idx),
      cover: rawPost.cover,
      digest: rawPost.digest,
    };
    return post;
  });

  return { raw, metadata, data };
}

async function savePosts(posts) {
  const resPosts = await Promise.all(posts.map((post) => {
    const {
      msgBiz,
      msgMid,
      msgIdx,
    } = post;
    return models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      post,
      { upsert: true, new: true }
    );
  }));

  // 保存抓取记录
  await models.ProfilePubRecord.savePubRecords(posts);

  resPosts.forEach(post => {
    debug('title', post.title);
    debug('id', post.id);
    debug('publishAt', post.publishAt);
  });
}

// 控制抓取前几页的数据
async function crawlByPage(fakeid, page) {
  for (let i = 1; i <= page; i++) {
    const rawData = await getPosts(fakeid, i);
    if (!rawData) continue;
    const res = handleRaw(rawData);
    const { metadata, data } = res;
    await savePosts(data);

    // 无更多抓取内容
    if (metadata.page >= metadata.totalPage) {
      debug('无更多抓取内容');
      break;
    }

    await sleepRandom(3000, 8000);
  }
}

// 按照发布时间控制抓取数据
async function crawlByPublishTime(fakeid, publishAt) {
  const fn = async (page) => {
    debug('正在抓取', fakeid, '第', page, '页');
    const rawData = await getPosts(fakeid, page);
    if (!rawData) return await fn(++page);

    const res = handleRaw(rawData);
    const { metadata, data } = res;
    await savePosts(data);

    // 无更多抓取内容
    if (metadata.page >= metadata.totalPage) {
      debug('无更多抓取内容');
      return;
    }

    if (data.length) {
      const post = data[data.length - 1];
      // 当发布时间条件达标时，退出函数
      if (post.publishAt <= publishAt) {
        debug('已抓取至设置的发布时间，退出抓取');
        return;
      }
    }

    // each
    await sleepRandom(3000, 8000);
    await fn(++page);
  };

  await fn(1);
}

module.exports = {
  crawlByPage,
  crawlByPublishTime,
};
