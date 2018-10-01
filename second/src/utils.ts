const redis = require('../../utils/redis');
const refDebug = require('debug');

const CRAWL_HISTORY_KEY = 'ws:mp:crawl:history';
const CRAWL_PROFILE_KEY = 'ws:mp:crawl:profile';
const DEFAULT_INTERVAL = 1000 * 60 * 60 * 8;
const TARGET_DATE = new Date('2018/7/1').getTime();

const debug = debugFn('utils');

export function debugFn(name: string): (...args: any[]) => void {
  return refDebug(`ws:mp:${name}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

export function randomNum(min: number, max: number): number {
  if (max === min) return max;
  if (max < min) [min, max] = [max, min];
  return Math.round(Math.random() * (max - min) + min);
}

export function sleepRandom(min: number, max: number): Promise<void> {
  const num = randomNum(min, max);
  debug('sleep ms', num);
  return sleep(num);
}

// 记录链接的抓取时间
export function logCrawlHistory(link: string): Promise<void> {
  return redis('hset', CRAWL_HISTORY_KEY, link, Date.now());
}

// 判断特定时间段内链接是否需要抓取
export function shouldCrawl(link: string, interval: number = DEFAULT_INTERVAL ): Promise<boolean> {
  return redis('hget', CRAWL_HISTORY_KEY, link).then((valStr: string) => {
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
export function logProfileCrawlHistory(biz: string, minTime: number = TARGET_DATE): Promise<void> {
  return redis('hset', CRAWL_PROFILE_KEY, biz, minTime);
}

// 判断目标在特定时间点是否需要抓取
export function shouldCrawlProfile(biz: string, minTime: number = TARGET_DATE): Promise<boolean> {
  return redis('hget', CRAWL_PROFILE_KEY, biz).then((valStr: string) => {
    const val = Number(valStr);
    if (!val) return true;
    if (minTime === val) return false;
    debug('typeof', typeof val);
    debug('profile minTime', minTime);
    debug('profile val', val);
    throw new Error('无此时间节点记录，请检查逻辑');
  });
}
