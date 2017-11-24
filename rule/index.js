'use strict';

const getMainData = require('./getMainData');
const getProfileData = require('./getProfileData');
const insertJsToNextPage = require('./insertJsToNextPage');
const insertJsToNextProfile = require('./insertJsToNextProfile');


module.exports = {
  summary:function() {
    return 'The rule for wechat spider, written by liqiang. ';
  },

  shouldUseLocalResponse : function(req, reqBody) {
    // 自定义网络请求，控制历史页下拉或跳转
    if (req.url.indexOf('tonextprofile') > -1) {
      return true;
    }
    return false;
  },

  dealLocalResponse : function(req,reqBody,callback) {
    // 自定义网络请求，控制历史页下拉或跳转
    if (req.url.indexOf('tonextprofile') > -1) {
      insertJsToNextProfile.isJumpToNext(req.url).then(text => {
        console.log('isJumpToNextProfile => ', text);
        callback(200, { 'content-type': 'text/plain' }, text);
      });
    }
    // callback(statusCode,resHeader,responseData);
  },

  replaceRequestProtocol:function(req,protocol) {
    return protocol;
  },

  replaceRequestOption : function(req,option) {
    return option;
  },

  replaceRequestData: function(req,data) {
    return data;
  },

  replaceResponseStatusCode: function(req,res,statusCode) {
    return statusCode;
  },

  replaceResponseHeader: function(req,res,header) {
    return header;
  },

  replaceServerResDataAsync: function(req,res,serverResData,callback) {
    let link = req.url;
    // 获取点赞量和阅读量
    if (link.indexOf('getappmsgext') > -1) {
      getMainData(link, serverResData).then(() => {
        callback(serverResData);
      });
    // 通过历史消息页抓取文章url等
    } else if (/profile_ext.+__biz/.test(link)) {
      getProfileData(link, res, serverResData).then(() => {
        return insertJsToNextProfile(link, res, serverResData);
      }).then(content => {
        callback(content);
      });
    // 文章页跳转
    } else if (/\/s\?__biz/.test(link) || /mp\/appmsg\/show/.test(link)) {
      insertJsToNextPage(link, serverResData).then((content) => {
        if (content) {
          callback(content);
        } else {
          callback(serverResData);
        }
      });
    } else {
      callback(serverResData);
    }
  },

  pauseBeforeSendingResponse : function(req, res) {
    return 0;
  },

  shouldInterceptHttpsReq :function(req) {
    if (req.headers.host === 'mp.weixin.qq.com') return true;
    return false;
  }
};
