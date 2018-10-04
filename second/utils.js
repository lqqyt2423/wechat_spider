'use strict';

const redis = require('../utils/redis');
const refDebug = require('debug');

const CRAWL_HISTORY_KEY = 'ws:mp:crawl:history';
const CRAWL_PROFILE_KEY = 'ws:mp:crawl:profile';
const DEFAULT_INTERVAL = 1000 * 60 * 60 * 8;
const TARGET_DATE = new Date('2018/7/1').getTime();

const debug = debugFn('utils');

function debugFn(name) {
  return refDebug(`ws:mp:${name}`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomNum(min, max) {
  if (max === min) return max;
  if (max < min) [min, max] = [max, min];
  return Math.round(Math.random() * (max - min) + min);
}

function sleepRandom(min, max) {
  const num = randomNum(min, max);
  debug('sleep ms', num);
  return sleep(num);
}

// 记录链接的抓取时间
function logCrawlHistory(link) {
  return redis('hset', CRAWL_HISTORY_KEY, link, Date.now());
}

// 判断特定时间段内链接是否需要抓取
function shouldCrawl(link, interval = DEFAULT_INTERVAL ) {
  return redis('hget', CRAWL_HISTORY_KEY, link).then((valStr) => {
    const val = Number(valStr);
    if (!val) {
      debug('不存在此链接抓取记录');
      return true;
    }
    if (val + interval < Date.now()) {
      debug('val', val),
      debug('interval', interval);
      debug('val + interval', val + interval);
      debug('now', Date.now());
      return true;
    }
    return false;
  });
}

// 记录公众号的抓取记录
function logProfileCrawlHistory(biz, minTime = TARGET_DATE) {
  return redis('hset', CRAWL_PROFILE_KEY, biz, minTime);
}

// 判断目标在特定时间点是否需要抓取
function shouldCrawlProfile(biz, minTime = TARGET_DATE) {
  return redis('hget', CRAWL_PROFILE_KEY, biz).then((valStr) => {
    const val = Number(valStr);
    if (!val) return true;
    if (minTime === val) return false;
    debug('typeof', typeof val);
    debug('profile minTime', minTime);
    debug('profile val', val);
    throw new Error('无此时间节点记录，请检查逻辑');
  });
}

module.exports = {
  debugFn,
  sleep,
  randomNum,
  sleepRandom,
  logCrawlHistory,
  shouldCrawl,
  logProfileCrawlHistory,
  shouldCrawlProfile,
};
