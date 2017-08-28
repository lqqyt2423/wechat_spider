'use strict';

module.exports = {
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/wechat_spider'
  },
  insertJsToNextPage: {
    disable: false,
    jumpInterval: 5,
    minTime: new Date(2017, 7, 1),
    maxTime: new Date(),
    isCrawlExist: false,
    targetBiz: []
  },
  insertJsToNextProfile: {
    disable: true,
    jumpInterval: 5,
    // 抓取到minTime 就跳转至下一公众号
    minTime: new Date(2017, 7, 1),
    // 自定义最近多久更新的公众号本次就不用抓取
    maxUpdatedAt: new Date(),
    targetBiz: [],
    // 程序开始时间
    beginTime: new Date()
  }
};
