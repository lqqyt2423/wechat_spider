'use strict';

const url = require('url');
const basicAuth = require('./basicAuth');
const config = require('../config');
const models = require('../models');
const logger = require('../utils/logger');
const { isPostPage } = require('./postLink');
const handleImg = require('./handleImg');
const getNextProfileLink = require('./getNextProfileLink');

const {
  getProfileBasicInfo,
  getPostList,
  handleProfileHtml
} = require('./handleProfileHistoryPage');
const {
  getReadAndLikeNum,
  getPostBasicInfo,
  handlePostHtml,
  getComments,
} = require('./handlePostPage');


const rule = {
  // 模块介绍
  summary: 'The rule for wechat spider, written by liqiang.',

  // 发送请求前拦截处理
  *beforeSendRequest(requestDetail) {
    const { requestOptions, url: link, requestData } = requestDetail;
    const { headers, method } = requestOptions;
    const { Accept } = headers;

    // 代理设置基本认证
    const authRes = basicAuth(headers);
    if (authRes) return authRes;

    // 处理图片返回
    if (/^image/.test(Accept)) {
      return handleImg();
    }

    // 处理前端发来的公众号已经抓取至第一篇文章的消息
    if (link.indexOf('/wx/profiles/first_post') > -1 && method === 'POST') {
      const data = JSON.parse(String(requestData));
      const msgBiz = url.parse(data.link, true).query.__biz;
      yield models.Profile.findOneAndUpdate(
        { msgBiz },
        { firstPublishAt: new Date(data.publishAt) }
      );

      logger.info('公众号 %s 更新firstPublishAt 成功', msgBiz);

      return {
        response: {
          statusCode: 200,
          header: { 'content-type': 'text/plain' },
          body: 'ok'
        }
      };
    }

    // 和历史消息页面交互，返回下一篇跳转的地址
    if (link.indexOf('/wx/profiles/next_link') > -1 && method === 'GET') {
      logger.debug('[next_link] %s', link);
      let nextLink;
      if (!config.rule.profile.disable) {
        nextLink = yield getNextProfileLink();
      }
      if (!nextLink) nextLink = '';

      logger.info('下一个历史消息跳转链接: %s', nextLink);

      return {
        response: {
          statusCode: 200,
          header: { 'content-type': 'application/json' },
          body: JSON.stringify({
            data: nextLink
          })
        }
      };
    }

    // front end logger
    if (link.includes('/wx/front_end_logger') && method === 'POST') {
      const data = JSON.parse(String(requestData));
      const message = data.message;
      logger.debug('[frontend] %s', message);
    }
  },

  // 发送响应前处理
  *beforeSendResponse(requestDetail, responseDetail) {
    const req = requestDetail;
    const res = responseDetail;
    const ctx = { req, res };
    const link = req.url;

    try {
      if (/mp\/getappmsgext/.test(link)) {
        yield getReadAndLikeNum(ctx);
        return;
      }

      if (isPostPage(link)) {
        yield getPostBasicInfo(ctx);
        return yield handlePostHtml(ctx);
      }

      if (/\/mp\/appmsg_comment/.test(link)) {
        yield getComments(ctx);
        return;
      }

      if (/\/mp\/profile_ext\?action=home&__biz=/.test(link)) {
        // console.log(res.response.body.toString());
        yield getProfileBasicInfo(ctx);
        return yield handleProfileHtml(ctx);
      }

      if (/\/mp\/profile_ext\?action=getmsg&__biz=/.test(link)) {
        yield getPostList(ctx);
        return;
      }
    } catch (e) {
      logger.error(e);
    }
  },

  // 默认关闭全局解析 HTTPS 流量
  // 仅当为微信的域名时，才会拦截解析，这样子性能会好很多
  *beforeDealHttpsRequest(requestDetail) {
    const { host } = requestDetail;

    const whitelist = [
      'mp.weixin.qq.com:443',
    ];

    const dealHttps = whitelist.includes(host);
    logger.info('receive https request: %s, %s', host, dealHttps ? 'begin intercept' : 'only transpond');
    return dealHttps;
  },

  // 请求出错的事件
  // *onError(requestDetail, error) { /* ... */ },

  // https连接服务器出错
  // *onConnectError(requestDetail, error) { /* ... */ }
};

module.exports = rule;
