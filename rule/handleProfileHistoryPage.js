'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const moment = require('moment');
const models = require('../models');
const config = require('../config');
const logger = require('../utils/logger');
const getNextProfileLink = require('./getNextProfileLink');
const savePostsData = require('./savePostsData');
const helper = require('../utils/helper');

const INSERT_PROFILE_SCRIPT = fs.readFileSync(path.join(__dirname, 'insertProfileScript.html'), 'utf8');
// 在历史页面时，不下拉页面，仅跳转
const ONLY_JUMP = false;

const {
  rule: ruleConfig,
} = config;

const { profile: profileConfig } = ruleConfig;

// 保存公众号基本信息
const getProfileBasicInfo = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;

  const body = res.response.body.toString();

  const getTarget = regexp => {
    let target;
    body.replace(regexp, (_, t) => {
      target = t;
    });
    return target || '';
  };

  const urlObj = url.parse(link, true);
  const msgBiz = urlObj.query.__biz;
  const title = getTarget(/var nickname =.*?\s"([^"]+?)"/);
  const headimg = getTarget(/var headimg =.*?\s"([^"]+?)"/);
  const username = getTarget(/var username =.*?\s"([^"]+?)"/);
  const desc = getTarget(/<p class="profile_desc">([\s\S]+?)<\/p>/).trim();

  const updateObj = {
    msgBiz,
    openHistoryPageAt: new Date(),
  };
  if (title) updateObj.title = helper.escape2Html(title);
  if (headimg) updateObj.headimg = headimg;
  if (username) updateObj.username = username;
  if (desc) updateObj.desc = helper.escape2Html(desc);

  // 更新微信号基础信息
  await models.Profile.findOneAndUpdate(
    { msgBiz },
    { $set: updateObj },
    { upsert: true }
  );

  const content = getTarget(/var msgList = '(.+)';\n/);

  if (!content) return;

  // logger.debug('[getPostList] link: %s', link);
  // logger.debug('[getPostList] headers: %s', JSON.stringify(req.requestOptions.headers));
  // logger.debug('[getPostList] response headers: %s', JSON.stringify(res.response.header));
  // logger.debug('[getPostList] response body: %s', body);

  const data = JSON.parse(helper.escape2Html(content).replace(/\\\//g, '/'));
  const postList = data.list;
  const savedPosts = await savePostsData(postList);
  await models.Profile.updateLatestPublishAt(savedPosts);
};

// 公众号历史页面保存文章信息
const getPostList = async function (ctx) {
  const { req, res } = ctx;

  // const link = req.url;
  // logger.debug('[getPostList] link: %s', link);
  // logger.debug('[getPostList] headers: %s', JSON.stringify(req.requestOptions.headers));

  const body = res.response.body.toString();

  // logger.debug('[getPostList] response headers: %s', JSON.stringify(res.response.header));
  // logger.debug('[getPostList] response: %s', body);

  const data = JSON.parse(body);
  const postList = JSON.parse(data.general_msg_list).list;
  await savePostsData(postList);
};

// 注入控制代码至手机前端，实现功能：
//   自动下拉页面至目标发布日期
//   自动跳转至下一公众号历史页面
const handleProfileHtml = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  let { minTime, jumpInterval } = profileConfig;
  let body = res.response.body.toString();

  const warnHandler = async () => {
    const nextLink = await getNextProfileLink.must();
    const insertScript = '<meta http-equiv="refresh" content="' + jumpInterval + ';url=' + nextLink + '" />';
    body = body.replace('</title>', '</title>' + insertScript);
    return { response: { ...res.response, body } };
  };

  // 此账号已申请账号迁移
  if (body.includes('<h2 class="weui-msg__title">此帐号已申请帐号迁移</h2>')) {
    logger.warn('[失效公众号] 账号迁移 %s', link);
    return warnHandler();
  }

  // 疑似被投诉
  if (body.includes('<h2 class="weui-msg__title">已停止访问该网页</h2>')) {
    logger.warn('[失效公众号] 疑似被投诉 %s', link);
    return warnHandler();
  }

  // 账号自主注销
  if (body.includes('<h2 class="weui-msg__title">此账号已自主注销')) {
    logger.warn('[失效公众号] 账号自主注销 %s', link);
    return warnHandler();
  }

  const urlObj = url.parse(link, true);
  const msgBiz = urlObj.query.__biz;

  if (ONLY_JUMP) {
    minTime = Date.now();
  } else {
    // 最小时间再减一天 保证抓到的文章一定齐全
    await models.Profile.logInfo(msgBiz);
    minTime = new Date(minTime).getTime() - 1000 * 60 * 60 * 24;

    let tmpLogArr = ['[profile minTime]', 'minTime before:', moment(minTime).format('YYYY-MM-DD')];
    minTime = await models.ProfilePubRecord.getMinTargetTime(msgBiz, minTime);

    tmpLogArr = tmpLogArr.concat(['minTime after:', moment(minTime).format('YYYY-MM-DD')]);
    logger.info(tmpLogArr.join(' '));

    minTime = minTime.getTime();
  }

  // 根据抓取时间和公众号的抓取结果 判断是否下拉和页面跳转
  const insertScript = getInsertProfileScript(jumpInterval * 1000, minTime);
  body = body.replace('<!--headTrap<body></body><head></head><html></html>-->', '').replace('<!--tailTrap<body></body><head></head><html></html>-->', '');
  body = body.replace('</body>', insertScript + '</body>');
  return {
    response: { ...res.response, body }
  };
};

// 返回插入前端的脚本
function getInsertProfileScript(jumpInterval, jumpMinTime) {
  return INSERT_PROFILE_SCRIPT.replace(/JUMP_INTERVAL/g, jumpInterval).replace(/JUMP_MIN_TIME/g, jumpMinTime);
}

module.exports = {
  getProfileBasicInfo,
  getPostList,
  handleProfileHtml,
};
