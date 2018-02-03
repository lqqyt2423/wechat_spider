'use strict';

const express = require('express');
const api = express.Router();
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Category = require('../models/Category');
const config = require('../config').insertJsToNextProfile;

api.get('/posts', (req, res) => {
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
  let promise = Promise.resolve();
  if (req.query.category) {
    promise = promise.then(() => {
      return Category.findOne({ _id: req.query.category }).then(category => {
        if (!category) return;
        query.msgBiz = { $in: category.msgBizs };
      });
    });
  }
  return promise.then(() => {
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
    });
  }).catch(e => {
    console.log(e);
  });
});

api.get('/profiles', (req, res) => {
  let query = {};
  if (req.query.target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  let promise = Promise.resolve();
  if (req.query.category) {
    promise = promise.then(() => {
      return Category.findOne({ _id: req.query.category }).then(category => {
        if (!category) return;
        query.msgBiz = { $in: category.msgBizs };
      });
    });
  }
  return promise.then(() => {
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
            item._doc.postsAllCount = count;
          }),
          Post.count({ msgBiz: item.msgBiz, readNum: { $exists: true } }).then(count => {
            item._doc.postsHasDataCount = count;
          }),
          Post.find({ msgBiz: item.msgBiz, publishAt: { $exists: true } }).sort({ publishAt: -1 }).limit(1).then(posts => {
            if (!posts.length) return;
            item._doc.newestPostTime = posts[0].publishAt;
          }),
          Post.find({ msgBiz: item.msgBiz, publishAt: { $exists: true } }).sort({ publishAt: 1 }).limit(1).then(posts => {
            if (!posts.length) return;
            item._doc.oldestPostTime = posts[0].publishAt;
          })
        ]);
      })).then(() => {
        res.json({
          metadata: metadata,
          data: data
        });
      });
    });
  });
});

// 新建分类
api.post('/categories', (req, res, next) => {
  let name = req.query.name;
  let msgBizs = req.query.msgBizs;
  if (!name || !msgBizs) return next();
  Category.findOne({ name: name }).then(category => {
    if (category) return next();
    category = new Category({
      name: name,
      msgBizs: msgBizs.split(',')
    });
    return category.save();
  }).then(() => {
    res.send('ok');
  });
});

api.get('/categories', (req, res) => {
  Category.find({}).populate('profiles').then(categories => {
    res.json(categories);
  }).catch(e => {
    console.log(e);
  });
});

module.exports = api;
