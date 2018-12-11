'use strict';

const config = require('../config');
const redis = require('./redis');

const {
  redis: redisConfig,
} = config;

const { POST_LIST_KEY, PROFILE_LIST_KEY } = redisConfig;

function extract(doc, fields) {
  return fields.reduce((obj, key) => {
    const val = doc[key];
    if (val !== undefined) obj[key] = val;
    return obj;
  }, {});
}

function delCrawlLinkCache() {
  return redis('del', POST_LIST_KEY, PROFILE_LIST_KEY);
}

exports.extract = extract;
exports.delCrawlLinkCache = delCrawlLinkCache;
