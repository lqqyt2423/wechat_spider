'use strict';

var config = {
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/wechat_spider'
  },
  insertJsToNextPage: {
    disable: false,
    jumpInterval: 3,
    minTime: new Date(2017, 6, 1),
    maxTime: new Date(2017, 8, 27),
    isCrawlExist: false,
    // if true updateNumAt - publishAt
    crawlExistInterval: 1000*60*60*24*5,
    targetBiz: []
  },
  insertJsToNextProfile: {
    disable: false,
    jumpInterval: 10,
    // 抓取到minTime 就跳转至下一公众号
    minTime: new Date(2017, 8, 23),
    // 自定义最近多久更新的公众号本次就不用抓取
    maxUpdatedAt: new Date(2017, 9, 1),
    targetBiz: [],
    // 程序开始时间
    beginTime: new Date()
  }
};

config.insertJsToNextProfile.targetBiz = require('./targetProfileBiz.json');
config.insertJsToNextPage.targetBiz = require('./targetProfileBiz.json');

module.exports = config;