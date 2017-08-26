'use strict';

module.exports = {
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/wechat_spider'
  },
  insertJsToNextPage: {
    jumpInterval: 3,
    minTime: new Date(2017, 7, 1),
    maxTime: new Date(),
    isCrawlExist: false,
    targetBiz: ['MzA5MDM1MTcyNQ==']
  }
};
