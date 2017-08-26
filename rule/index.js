const getMainData = require('./getMainData');
const getProfileData = require('./getProfileData');


module.exports = {
    summary:function() {
      return "The rule for wechat spider, written by liqiang. ";
    },

    shouldUseLocalResponse : function(req,reqBody) {
      return false;
    },

    dealLocalResponse : function(req,reqBody,callback) {
      callback(statusCode,resHeader,responseData);
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
          callback(serverResData);
        })
      } else {
        callback(serverResData);
      }
    },

    pauseBeforeSendingResponse : function(req,res) {
    	return 0;
    },

    shouldInterceptHttpsReq :function(req) {
      if (req.headers.host === 'mp.weixin.qq.com') return true;
      return false;
    }
};
