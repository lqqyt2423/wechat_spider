'use strict';

const {
  debugFn,
  logProfileCrawlHistory,
  shouldCrawlProfile,
} = require('./utils');
const { crawlByPublishTime } = require('./crawl_urls');

const config = require('../config');
const models = require('../models');

// 目标 bizs
const { rule: { profile: { targetBiz, minTime } } } = config;

const debug = debugFn('task');

// 默认抓取时间
const CRAWL_TO_TIME = new Date(minTime.getTime() - 1000 * 60 * 60 * 24);

(async () => {
  for (const biz of targetBiz) {
    if (!(await shouldCrawlProfile(biz))) {
      // tmp: 将所有已经抓完的公众号添加 pub record
      const posts = await models.Post.find({
        msgBiz: biz,
        publishAt: { $gte: minTime },
      }).select('-content');
      await models.ProfilePubRecord.savePubRecords(posts);
      debug('记录显示', biz, '已经抓取完成');
      continue;
    }
    await crawlByPublishTime(biz, CRAWL_TO_TIME);
    debug(biz, CRAWL_TO_TIME, '抓取完成');
    await logProfileCrawlHistory(biz);
  }
  debug('all done');
})();
