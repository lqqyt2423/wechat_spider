'use strict';

const Post = require('../models/Post');
const Profile = require('../models/Profile');
const targetBiz = require('../targetProfileBiz.json');
const config = require('../config').insertJsToNextPage;
const fs = require('fs');
const json2csv = require('json2csv');
const moment = require('moment');
const schools = require('../schools');
const sInfo = [], sName = [], wName = [];
schools.forEach(s => {
  sInfo.push(s[0]);
  sName.push(s[1]);
  wName.push(s[2]);
});

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
    fs.writeFileSync('./weixin-basic.csv', csv);
    // 聚合统计
    // 发文总阅读量 平均阅读数 头条阅读总量  推送次数  发文总点赞量  平均点赞量 头条点赞总量  单篇最高阅读量 季度发文数
    let aggrObj = {},
      aggrArray = [];
    data.forEach(item => {
      let key = item.msgBiz;
      if (key in aggrObj) {
        aggrObj[key].sumReadNum += item.readNum;
        aggrObj[key].sumLikeNum += item.likeNum;
        aggrObj[key].count += 1;
        if (item.msgIdx == '1') {
          aggrObj[key].firstSumReadNum += item.readNum;
          aggrObj[key].firstSumLikeNum += item.likeNum;
          aggrObj[key].pushCount += 1;
        }
        if (item.readNum > aggrObj[key].topReadNum) {
          aggrObj[key].topReadNum = item.readNum;
        }
      } else {
        aggrObj[key] = {
          profileTitle: item.profileTitle,
          wechatId: item.wechatId,
          sumReadNum: item.readNum,
          sumLikeNum: item.likeNum,
          count: 1,
          firstSumReadNum: 0,
          firstSumLikeNum: 0,
          pushCount: 0,
          topReadNum: item.readNum
        };
        if (item.msgIdx == '1') {
          aggrObj[key].firstSumReadNum = item.readNum;
          aggrObj[key].firstSumLikeNum = item.likeNum;
          aggrObj[key].pushCount = 1;
        }
      }
    });
    Object.keys(aggrObj).forEach(key => {
      let item = aggrObj[key];
      let profileTitle = item.profileTitle;
      let i = wName.indexOf(profileTitle);
      if (i == -1) {
        throw Error(profileTitle);
      }
      let schoolInfo = sInfo[i];
      let schoolName = sName[i];
      aggrArray.push({
        msgBiz: key,
        schoolInfo: schoolInfo,
        schoolName: schoolName,
        profileTitle: profileTitle,
        wechatId: item.wechatId,
        sumReadNum: item.sumReadNum,
        aveReadNum: Math.round(item.sumReadNum / item.count),
        firstSumReadNum: item.firstSumReadNum,
        pushCount: item.pushCount,
        sumLikeNum: item.sumLikeNum,
        aveLikeNum: Math.round(item.sumLikeNum / item.count),
        firstSumLikeNum: item.firstSumLikeNum,
        topReadNum: item.topReadNum,
        count: item.count
      });
    });
    let aggrFields = ['msgBiz', 'schoolInfo', 'schoolName', 'profileTitle', 'wechatId', 'sumReadNum', 'aveReadNum', 'firstSumReadNum', 'pushCount', 'sumLikeNum', 'aveLikeNum', 'firstSumLikeNum', 'topReadNum', 'count'],
      aggrFieldNames = ['msgBiz', '属性', '学校名称', '微信公号', '公众号ID', '发文总阅读量', '平均阅读数', '头条阅读总量', '推送次数', '发文总点赞量', '平均点赞量', '头条点赞总量', '单篇最高阅读量', '总发文数'],
      aggrCsv = json2csv({ data: aggrArray, fields: aggrFields, fieldNames: aggrFieldNames });
    fs.writeFileSync('./weixin-aggr.csv', aggrCsv);
  });
}

exportToCsv().then(() => {
  console.log('done');
}).catch(e => {
  console.log(e);
});