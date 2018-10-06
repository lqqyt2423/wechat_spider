'use strict';

const assert = require('assert');
const models = require('../../models');

describe('Model ProfilePubRecord', function() {
  describe('statics getMinTargetTime', function() {
    it('正常情况', async function() {
      const msgBiz = 'MzI4NjQyMTM2Mw==';
      let minTime = new Date('2017/1/1');
      minTime = await models.ProfilePubRecord.getMinTargetTime(msgBiz, minTime);
      assert(minTime >= new Date('2017/5/19'));
    });

    it('超过第一篇的发布日期的情况', async function() {
      const msgBiz = 'MzI4NjQyMTM2Mw==';
      let minTime = new Date('2016/1/1');
      minTime = await models.ProfilePubRecord.getMinTargetTime(msgBiz, minTime);
      console.log('minTime', minTime);
      assert(minTime >= new Date('2017/5/19'));
    });
  });
});
