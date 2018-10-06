'use strict';

const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;
const debug = require('debug')('ws:ProfilePubRecord');
const config = require('../config');
const redis = require('../utils/redis');

const MIN_TIME = config.rule.profile.minTime;
const DAY_MS = 1000 * 60 * 60 * 24;

// 10 s 冗余时间
const SAVE_LAST_MIN_EX = config.rule.profile.jumpInterval + 10;
const SAVE_RECORD_KEY_PREFIX = 'wx:pub:record:';

// 公众号的发布文章记录
const ProfilePubRecord = new Schema({
  // 公众号
  msgBiz: { type: String, required: true },
  // 日期 包含每一天 定义为每天 0 点
  date: { type: Date, required: true },
  // 发布次数 0 - 未发布 1 - 当日发布一次（居多） 2 - 以此类推
  pubCount: { type: Number, default: 0 },
  // 发布的总条数
  postCount: { type: Number, default: 0 },
});

ProfilePubRecord.plugin(require('motime'));

ProfilePubRecord.index({ msgBiz: 1, date: 1 }, { unique: true });

// 传入 posts 记录发布文章记录（确保当批记录按照天区分、确保为同一 profile）
// 记录公众号的发布文章记录
ProfilePubRecord.statics.savePubRecords = async function(posts) {
  if (!posts || !posts.length) return;
  const msgBiz = posts[0].msgBiz;
  const redisKey = `${SAVE_RECORD_KEY_PREFIX}${msgBiz}`;
  const recordMap = {};
  posts.forEach(post => {
    const publishAt = post.publishAt;
    const date = moment(publishAt).startOf('day').toDate();
    if (recordMap[date]) {
      recordMap[date].postCount += 1;
      recordMap[date].pubTimes.add(String(publishAt));
    } else {
      recordMap[date] = {
        postCount: 1,
        pubTimes: new Set([String(publishAt)]),
        timestamp: date.getTime(),
      };
    }
  });
  // min and max timestamp
  const timestampArr = Object.keys(recordMap).map(key => recordMap[key].timestamp);
  const minTimestamp = Math.min(...timestampArr);
  let maxTimestamp = Math.max(...timestampArr);

  // 取出上次暂存在 redis 的最小抓取时间
  let tmpTimestamp = await redis('get', redisKey);
  tmpTimestamp = Number(tmpTimestamp);
  if (tmpTimestamp && tmpTimestamp > maxTimestamp) maxTimestamp = tmpTimestamp;

  // insert or update
  for (let timestamp = minTimestamp; timestamp <= maxTimestamp; timestamp += DAY_MS) {
    const date = new Date(timestamp);
    const record = await this.findOneAndUpdate(
      {
        msgBiz,
        date,
      },
      {
        pubCount: ((recordMap[date] || {}).pubTimes || new Set()).size,
        postCount: (recordMap[date] || {}).postCount || 0,
      },
      { upsert: true, new: true }
    );
    // debug('写入数据库成功',
    //   record.msgBiz,
    //   moment(record.date).format('YYYY-MM-DD'),
    //   record.pubCount,
    //   record.postCount);
  }

  // 本次存储的最小抓取时间作为下次的最大抓取时间
  await redis('set', redisKey, minTimestamp, 'EX', SAVE_LAST_MIN_EX);
};

// 传入目标最小时间，返回需要抓取的最小时间
ProfilePubRecord.statics.getMinTargetTime = async function(msgBiz, minTime = MIN_TIME) {
  minTime = moment(minTime).startOf('day').toDate();
  const records = await this.find({
    msgBiz,
    date: { $gte: minTime },
  }).sort('date');
  if (!records.length) return minTime;

  // 最早一篇发布文章
  const profile = await mongoose.model('Profile').findOne({ msgBiz });
  if (!profile) return minTime;
  if (profile.firstPublishAt && profile.firstPublishAt > minTime) {
    minTime = profile.firstPublishAt;
  }

  const today = moment().startOf('day').toDate();
  const todayTimestamp = today.getTime();
  let i = 0;
  for (let timestamp = minTime.getTime(); timestamp <= todayTimestamp; timestamp += DAY_MS) {
    if (!records[i]) return new Date(timestamp);
    if (records[i].date.getTime() !== timestamp) return new Date(timestamp);
    ++i;
  }
  return today;
};

mongoose.model('ProfilePubRecord', ProfilePubRecord);
