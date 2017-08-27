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
  }
};
