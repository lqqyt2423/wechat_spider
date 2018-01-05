'use strict';

const url = require('url');
const cheerio = require('cheerio');
const querystring = require('querystring');
const config = require('../config').insertJsToNextPage;
const Post = require('../models/Post');
var links = [];

function insertJsToNextPage(link, content) {
  console.log('Post.links.length => ', links.length);
  let identifier = querystring.parse(url.parse(link).query);
  const [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];
  content = content.toString();
  let promise = Promise.resolve();
  promise = promise.then(() => {
    return saveData(msgBiz, msgMid, msgIdx, content).then(() => {});
  }).catch(e => {
    console.log(e);
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
    });
  }
  return promise.then(() => {
    return postQueue().then(link => {
      if (link) {
        let insertJs = '<meta http-equiv="refresh" content="' + config.jumpInterval + ';url=' + link + '" />';
        content = content.replace('</title>', '</title>' + insertJs);
        return content;
      }
    });
  });
}

function postQueue() {
  if (links.length) {
    let promise = Promise.resolve();
    return promise.then(() => {
      return links.shift();
    });
  } else {
    let query = { isFail: null };
    query.publishAt = { $gte: config.minTime, $lte: config.maxTime };
    if (!config.isCrawlExist) {
      query.updateNumAt = null;
    } else {
      query.$or = [{ updateNumAt: null }, {
        $and: [{ updateNumAt: { $exists: true } }, { publishAt: { $exists: true } }, { $where: `this.updateNumAt.getTime() - this.publishAt.getTime() < ${config.crawlExistInterval}` }]
      }];
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
    });
  }
}

function saveData(msgBiz, msgMid, msgIdx, content) {
  let wechatId = /<span class="profile_meta_value">(.+?)<\/span>/.exec(content)[1];
  if (config.isSavePostContent) {
    // 获取正文内容
    let $ = cheerio.load(content, { decodeEntities: false });
    let body = $('#js_content').html() || '';
    body = body.trim();
    return Post.findOneAndUpdate({
      msgBiz: msgBiz,
      msgMid: msgMid,
      msgIdx: msgIdx
    }, {
      wechatId: wechatId,
      content: body
    }, { upsert: true });
  } else {
    return Post.findOneAndUpdate({
      msgBiz: msgBiz,
      msgMid: msgMid,
      msgIdx: msgIdx
    }, {
      wechatId: wechatId
    }, { upsert: true });
  }
}

module.exports = insertJsToNextPage;