'use strict';

const fs = require('fs');

const config = {
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/wechat_spider'
  },
  redis: {
    port: 6379,
    host: '127.0.0.1',
    POST_LIST_KEY: 'wechat_spider:post_list',
    PROFILE_LIST_KEY: 'wechat_spider:profile_list'
  },
  // 是否用本地图片替换所有的图片请求 加快网络速度
  isReplaceImg: true,
  // 是否替换显示在手机上的微信文章正文内容 加快网路速度
  isReplacePostBody: true,
  insertJsToNextPage: {
    // 是否关闭自动跳转页面
    disable: false,
    // 跳转时间间隔 s
    jumpInterval: 2,
    // 跳转文章发布时间范围
    minTime: new Date('2018-4-1'),
    maxTime: new Date('2018-7-1'),
    // 已有数据的文章是否再抓取
    isCrawlExist: false,
    // if true updateNumAt - publishAt
    crawlExistInterval: 1000 * 60 * 60 * 24 * 3,
    // 抓取公众号biz范围
    targetBiz: [],
    // 是否保存文章内容
    isSavePostContent: true,
    // 保存内容的形式: html/text
    saveContentType: 'text',
  },
  insertJsToNextProfile: {
    // 是否关闭自动跳转页面
    disable: false,
    // 仅scroll 不跳转
    onlyScroll: false,
    // 跳转时间间隔 s
    jumpInterval: 5,
    // 抓取到minTime就跳转至下一公众号
    minTime: new Date('2018-6-18'),
    // 自定义最近多久更新的公众号本次就不用抓取
    maxUpdatedAt: new Date('2018-7-1'),
    // 抓取公众号biz范围
    targetBiz: [],
    // 程序开始时间
    beginTime: new Date()
  },
  // 是否抓取评论
  isCrawlComments: true
};

try {
  // 引入外部biz文件
  const bizs = fs.readFileSync('./bizs.txt', 'utf8').trim().split('\n') || [];
  if (bizs.length) {
    config.insertJsToNextProfile.targetBiz = bizs;
    config.insertJsToNextPage.targetBiz = bizs;
  }
} catch(e) {
  // Do nothing
}

module.exports = config;
