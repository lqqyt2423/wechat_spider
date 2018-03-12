'use strict';

const getMainData = require('./getMainData');
const getProfileData = require('./getProfileData');
const insertJsToNextPage = require('./insertJsToNextPage');
const insertJsToNextProfile = require('./insertJsToNextProfile');
const getComment = require('./getComment');
const config = require('../config');
const debug = require('debug')('wechat_spider:rule');

const rule = {
  // 模块介绍
  summary: 'The rule for wechat spider, written by liqiang.',

  // 发送请求前拦截处理
  *beforeSendRequest(requestDetail) {
    const link = requestDetail.url;

    // 自定义网络请求，控制历史页下拉或跳转
    if (link.indexOf('tonextprofile') > -1) {
      return insertJsToNextProfile.isJumpToNext(link).then(text => {
        debug('是否跳转至下一个公众号 => ', text);
        return {
          response: {
            statusCode: 200,
            header: { 'content-type': 'text/plain' },
            body: text
          }
        };
      });
    }
  },

  // 发送响应前处理
  *beforeSendResponse(requestDetail, responseDetail) {
    const link = requestDetail.url;
    const { response } = responseDetail;
    const { body } = response;

    if (link.indexOf('getappmsgext') > -1) {
      // 获取点赞量和阅读量
      return getMainData(link, body).then(() => {
        return null;
      });
    } else if (/mp\/profile_ext.+__biz/.test(link)) {
      // 通过历史消息页抓取文章url等
      return getProfileData(link, response, body).then(() => {
        return insertJsToNextProfile(link, response, body);
      }).then(content => {
        return {
          response: { ...response, body: content }
        };
      });
    } else if (/\/s\?__biz/.test(link) || /mp\/appmsg\/show/.test(link)) {
      // 文章页跳转
      return insertJsToNextPage(link, body).then((content) => {
        if (content) {
          return {
            response: { ...response, body: content }
          };
        } else {
          return null;
        }
      });
    } else if (/\/mp\/appmsg_comment/.test(link)) {
      // 抓取评论
      if (config.isCrawlComments) {
        return getComment(link, body).then(() => {
          return null;
        });
      } else {
        return null;
      }
    } else {
      return null;
    }
  },

  // 是否处理https请求
  *beforeDealHttpsRequest(requestDetail) {
    const { host } = requestDetail;
    if (host === 'mp.weixin.qq.com:443') return true;
    return false;
  },

  // 请求出错的事件
  // *onError(requestDetail, error) { /* ... */ },

  // https连接服务器出错
  // *onConnectError(requestDetail, error) { /* ... */ }
};

module.exports = rule;
