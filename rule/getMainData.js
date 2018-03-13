'use strict';

const models = require('../models');
const url = require('url');
const querystring = require('querystring');
const { log } = console;
const { Post } = models;

function getMainData(link, content) {
  const { __biz, mid, idx } = querystring.parse(url.parse(link).query);
  const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];
  content = JSON.parse(content.toString());
  const { read_num, like_num } = content.appmsgstat;
  const [readNum, likeNum] = [read_num, like_num];

  return Post.findOneAndUpdate(
    { msgBiz, msgMid, msgIdx },
    { readNum, likeNum, updateNumAt: new Date() },
    { new: true, upsert: true }
  ).then(post => {
    const { id, title, readNum, likeNum } = post;
    log(`文章: ${title || id}\n阅读量: ${readNum}, 点赞量: ${likeNum}\n`);
  }).catch(e => {
    console.log(e);
  });
}

module.exports = getMainData;
