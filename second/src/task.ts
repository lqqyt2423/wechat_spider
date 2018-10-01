import {
  debugFn,
  logProfileCrawlHistory,
  shouldCrawlProfile,
} from './utils';
import { crawlByPublishTime } from './crawl_urls';
const config = require('../../config');

// 目标 bizs
const { rule: { profile: { targetBiz, minTime } } } = config;

const debug = debugFn('task');

// 默认抓取时间
const CRAWL_TO_TIME = minTime;

(async () => {
  for (const biz of targetBiz) {
    if (!(await shouldCrawlProfile(biz))) {
      debug('记录显示', biz, '已经抓取完成')
      continue;
    }
    await crawlByPublishTime(biz, CRAWL_TO_TIME);
    debug(biz, CRAWL_TO_TIME, '抓取完成');
    await logProfileCrawlHistory(biz);
  }
  debug('all done');
})();
