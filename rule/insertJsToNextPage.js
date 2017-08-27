'use strict';

const url = require('url');
const querystring = require('querystring');
const config = require('../config').insertJsToNextPage;
const Post = require('../models/Post');
var links = [];

function insertJsToNextPage(link, content) {
  console.log('links.length: ', links.length);
  let identifier = querystring.parse(url.parse(link).query);
  const [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];
  content = content.toString();
  let promise = Promise.resolve();
  promise = promise.then(() => {
    return saveData(msgBiz, msgMid, msgIdx, content).then(() => {});
  });
  if (config.disable) return promise;
  // 判断此文是否失效
  if (content.indexOf('global_error_msg') > -1 || content.indexOf('icon_msg warn') > -1) {
    promise = promise.then(() => {
      return Post.findOne({
        msgBiz: msgBiz,
        msgMid: msgMid,
        msgIdx: msgIdx
      }).then(post => {
        if (post) {
          return Post.findByIdAndUpdate(post._id, {
            isFail: true
          });
        }
      });
    })
  }
  return promise.then(() => {
    return postQueue().then(link => {
      if (link) {
        let insertJs = '<meta http-equiv="refresh" content="' + config.jumpInterval + ';url=' + link + '" />';
        content = content.replace('</title>', '</title>' + insertJs);
        return content;
      }
    })
  })
}

function postQueue() {
  if (links.length) {
    let promise = Promise.resolve();
    return promise.then(() => {
      return links.shift();
    })
  } else {
    let query = {};
    query.publishAt = { $gte: config.minTime, $lte: config.maxTime };
    if (!config.isCrawlExist) {
      query.readNum = null;
      query.likeNum = null;
    }
    let targetBiz = config.targetBiz;
    if (targetBiz && targetBiz.length) {
      query.msgBiz = { $in: targetBiz };
    }
    return Post.find(query, { link: 1 }).then(posts => {
      if (posts && posts.length) {
        posts.forEach(post => {
          links.push(post.link);
        });
        return links.shift();
      }
    })
  }
}

function saveData(msgBiz, msgMid, msgIdx, content) {
  let wechatId = /<span class="profile_meta_value">(.+?)<\/span>/.exec(content)[1];
  return Post.findOne({
    msgBiz: msgBiz,
    msgMid: msgMid,
    msgIdx: msgIdx
  }).then(post => {
    if (post) {
      return Post.findByIdAndUpdate(post._id, {
        wechatId: wechatId
      });
    }
  });
}

module.exports = insertJsToNextPage;