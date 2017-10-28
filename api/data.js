const express = require('express');
const api = express.Router();
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const config = require('../config').insertJsToNextProfile;

api.get('/posts', (req, res, next) => {
  let query = { title: { $exists: true } };
  if (req.query.target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  if (req.query.mainData === 'true') {
    query.readNum = { $exists: true };
  }
  if (req.query.mainData === 'false') {
    query.readNum = { $exists: false };
  }
  if (req.query.msgBiz) {
    query.msgBiz = req.query.msgBiz;
  }
  let sortWay = { publishAt: -1, msgIdx: 1 };
  if (req.query.sortWay === '-updateNumAt') {
    sortWay = { updateNumAt: -1 };
  }
  if (req.query.sortWay === 'updateNumAt') {
    sortWay = { updateNumAt: 1 };
  }
  if (req.query.sortWay === '-publishAt') {
    sortWay = { publishAt: -1, msgIdx: 1 };
  }
  if (req.query.sortWay === 'publishAt') {
    sortWay = { publishAt: 1, msgIdx: 1 };
  }
  return Post.find(query).sort(sortWay).populate('profile').paginate(req.query).then(result => {
    let data = result.data;
    let metadata = {
      options: result.options,
      perPage: result.options.perPage,
      currentPage: result.current,
      next: result.next,
      prev: result.prev,
      totalPages: result.totalPages,
      count: result.count
    };
    res.json({
      metadata: metadata,
      data: data
    });
  }).catch(e => {
    console.log(e);
  })
})

api.get('/profiles', (req, res, next) => {
  let query = {};
  if (req.query.target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  return Profile.find(query).sort({ openHistoryPageAt: -1 }).paginate(req.query).then(result => {
    let data = result.data;
    let metadata = {
      options: result.options,
      perPage: result.options.perPage,
      currentPage: result.current,
      next: result.next,
      prev: result.prev,
      totalPages: result.totalPages,
      count: result.count
    };
    Promise.all(data.map(item => {
      return Promise.all([
        Post.count({ msgBiz: item.msgBiz }).then(count => {
          // data 对象有些奇怪
          item._doc.postsAllCount = count;
        }),
        Post.count({ msgBiz: item.msgBiz, readNum: { $exists: true } }).then(count => {
          item._doc.postsHasDataCount = count;
        })
      ])
    })).then(() => {
      res.json({
        metadata: metadata,
        data: data
      });
    })
  })
})

module.exports = api;