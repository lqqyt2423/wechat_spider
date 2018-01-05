'use strict';

var config = {
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/wechat_spider'
  },
  insertJsToNextPage: {
    disable: false,
    jumpInterval: 2,
    minTime: new Date(2017, 0, 1),
    maxTime: new Date(2017, 11, 1),
    isCrawlExist: false,
    // if true updateNumAt - publishAt
    crawlExistInterval: 1000*60*60*24*3,
    targetBiz: [],
    // 是否保存文章html代码
    isSavePostContent: false
  },
  insertJsToNextProfile: {
    disable: false,
    jumpInterval: 15,
    // 抓取到minTime 就跳转至下一公众号
    minTime: new Date(2017, 10, 25),
    // 自定义最近多久更新的公众号本次就不用抓取
    maxUpdatedAt: new Date(2017, 11, 1),
    targetBiz: [],
    // 程序开始时间
    beginTime: new Date()
  },
  // 是否抓取评论
  isCrawlComments: true
};

config.insertJsToNextProfile.targetBiz = require('./targetProfileBiz.json');
config.insertJsToNextPage.targetBiz = require('./targetProfileBiz.json');

module.exports = config;