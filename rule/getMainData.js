'use strict';

const Post = require('../models/Post');
const url = require('url');
const querystring = require('querystring');
const moment = require('moment');
const debug = require('debug')('wechat_spider:data');
// const sendPostsData = require('../api/io').sendPostsData;

function getMainData(link, content) {
  let promise = Promise.resolve();
  let identifier = querystring.parse(url.parse(link).query);
  const [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];
  content = JSON.parse(content.toString());
  const [ readNum, likeNum ] = [ content.appmsgstat.read_num, content.appmsgstat.like_num ];
  return promise.then(() => {
    return Post.findOne({
      msgBiz: msgBiz,
      msgMid: msgMid,
      msgIdx: msgIdx
    }).then(post => {
      if (post) {
        return Post.findByIdAndUpdate(post._id, {
          readNum: readNum,
          likeNum: likeNum,
          updateNumAt: new Date()
        }, { new: true });
      } else {
        let post = new Post({
          msgBiz: msgBiz,
          msgMid: msgMid,
          msgIdx: msgIdx,
          readNum: readNum,
          likeNum: likeNum,
          updateNumAt: new Date()
        });
        return post.save();
      }
    }).then(post => {
      debug({
        title: post.title,
        publishAt: post.publishAt ? moment(post.publishAt).format('YYYY-MM-DD HH:mm') : '',
        updateNumAt: post.updateNumAt ? moment(post.updateNumAt).format('YYYY-MM-DD HH:mm') : '',
        readNum: post.readNum,
        likeNum: post.likeNum
      });
      // sendPostsData();
    }).catch(e => {
      console.log(e);
    });
  });
}

module.exports = getMainData;