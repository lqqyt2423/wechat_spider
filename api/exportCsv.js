'use strict';

const Post = require('../models/Post');
const Profile = require('../models/Profile');
const targetBiz = require('../targetProfileBiz.json');
const config = require('../config').insertJsToNextPage;
const fs = require('fs');
const json2csv = require('json2csv');
const moment = require('moment');

function exportToJson() {
  return Post.find({
    msgBiz: { $in: targetBiz },
    updateNumAt: { $exists: true },
    publishAt: { $gte: config.minTime, $lte: config.maxTime }
  }).sort({ msgBiz: 1 }).populate('profile').then(posts => {
    let json = JSON.stringify(posts, null, 4);
    fs.writeFileSync('./export.json', json);
  });
}

function exportToCsv() {
  return Post.find({
    msgBiz: { $in: targetBiz },
    updateNumAt: { $exists: true },
    publishAt: { $gte: config.minTime, $lte: config.maxTime }
  }).sort({ msgBiz: 1, publishAt: 1, msgIdx: 1 }).populate('profile').then(posts => {
    let data = posts.map(post => {
      return {
        profileTitle: post.profile.title,
        wechatId: post.wechatId,
        publishAt: moment(post.publishAt).format('YYYY-MM-DD HH:mm'),
        msgIdx: post.msgIdx,
        readNum: post.readNum,
        likeNum: post.likeNum,
        title: post.title,
        digest: post.digest,
        link: post.link,
        cover: post.cover,
        sourceUrl: post.sourceUrl,
        msgBiz: post.msgBiz
      };
    });
    let fields = ['profileTitle', 'wechatId', 'publishAt', 'msgIdx', 'readNum', 'likeNum', 'title', 'digest', 'link', 'cover', 'sourceUrl', 'msgBiz'];
    let fieldNames = ['公众号名称', '公众号ID', '发布时间', '发布位置', '阅读数', '点赞数', '标题', '摘要', '链接', '封面', '阅读原文链接', 'msgBiz'];
    let csv = json2csv({ data: data, fields: fields, fieldNames: fieldNames });
    fs.writeFileSync('./export.csv', csv);
  });
}

exportToCsv().then(() => {
  console.log('done');
});