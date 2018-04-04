'use strict';

const models = require('../models');

module.exports = class CorrectWechatId {

  constructor(options = {}) {
    const { msgBiz, wechatId } = options;
    if (!msgBiz || !wechatId) throw new Error('请传入正确参数');

    this.msgBiz = msgBiz;
    this.wechatId = wechatId;
  }

  async checkPost() {
    const res = await this.updateWechatId('Post');
    if (res.nModified) {
      console.log(`msgBiz: ${this.msgBiz}, wechatId: ${this.wechatId}`);
      console.log(`文章数据表中更新了${res.nModified}条记录`);
      console.log();
    }
  }

  async checkProfile() {
    const res = await this.updateWechatId('Profile');
    if (res.nModified) {
      console.log(`msgBiz: ${this.msgBiz}, wechatId: ${this.wechatId}`);
      console.log(`账号数据表中更新了${res.nModified}条记录`);
      console.log();
    }
  }

  async updateWechatId(modelName) {
    return await models[modelName].updateMany(
      { msgBiz: this.msgBiz, wechatId: { $ne: this.wechatId } },
      { wechatId: this.wechatId }
    );
  }

};
