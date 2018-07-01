'use strict';

const models = require('../models');
const CorrectWechatId = require('../utils/correctWechatId');

(async function start() {
  await fixWechatId();
  await checkWechatId();
  process.exit();
})();

async function checkWechatId() {
  const posts = await models.Post.find({
    msgBiz: { $exists: true },
    wechatId: { $exists: true }
  }).select('msgBiz wechatId');

  // 所有账号对象
  const bizObj = {};
  posts.forEach(post => {
    const { msgBiz, wechatId } = post;
    if (!bizObj[msgBiz]) {
      bizObj[msgBiz] = [wechatId];
    } else {
      if (bizObj[msgBiz].indexOf(wechatId) === -1) bizObj[msgBiz].push(wechatId);
    }
  });

  // 所有账号数组
  const bizArray = Object.keys(bizObj).map(msgBiz => {
    return { msgBiz: msgBiz, wechatIds: bizObj[msgBiz] };
  });

  // 仅有一个wechatId的msgBiz
  const singleWechatIdArray = bizArray.filter(item => {
    const wechatIds = item.wechatIds.filter(id => id);
    if (wechatIds.length === 1) {
      // 过滤掉中文的字符
      if (/[\u4e00-\u9fa5]/.test(wechatIds[0])) return false;
      return true;
    }
    return false;
  }).map(item => {
    return {
      msgBiz: item.msgBiz,
      wechatId: item.wechatIds.filter(id => id)[0]
    };
  });

  // 更新数据表记录
  for (let item of singleWechatIdArray) {
    const { msgBiz, wechatId } = item;
    const correctRecord = new CorrectWechatId({ msgBiz, wechatId });
    await correctRecord.checkPost();
    await correctRecord.checkProfile();
  }

  const singleMsgBizs = singleWechatIdArray.map(item => item.msgBiz);

  // 其余有问题的需手动解决
  const hasToFix = bizArray.filter(item => {
    return singleMsgBizs.indexOf(item.msgBiz) === -1;
  });

  hasToFix.forEach(item => {
    console.log('msgBiz:', item.msgBiz);
    console.log('wechatIds', item.wechatIds.filter(id => id).join(', '));
    console.log();
  });
}

// 手动修复
async function fixWechatId() {
  const array = [
    ['JinanUniversity', 'MjM5OTQwMTE0Mw=='],
    ['gzchfb', 'MzIyODgwMTA3Mg=='],
  ];

  if (array.length === 0) return;

  // 更新数据表记录
  for (let item of array) {
    const [wechatId, msgBiz] = item;
    const correctRecord = new CorrectWechatId({ msgBiz, wechatId });
    await correctRecord.checkPost();
    await correctRecord.checkProfile();
  }
}
