'use strict';

const express = require('express');
const api = express();
const config = require('../config').insertJsToNextProfile;
const models = require('../models');
const { Category, Profile, Post } = models;

function wrap(fn) {
  return function(req, res, next) {
    fn.call(this, req, res, next).catch(next);
  };
}

api.get('/posts', (req, res, next) => {
  const {
    target,
    mainData,
    msgBiz,
    category,
    sortWay,
    q
  } = req.query;

  const query = { title: { $exists: true } };

  if (q) {
    query.title = new RegExp(q, 'i');
  }
  if (target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  if (mainData === 'true') {
    query.readNum = { $exists: true };
  }
  if (mainData === 'false') {
    query.readNum = { $exists: false };
  }
  if (msgBiz) {
    query.msgBiz = msgBiz;
  }

  let sortWayResult = { publishAt: -1, msgIdx: 1 };
  if (sortWay === '-updateNumAt') {
    sortWayResult = { updateNumAt: -1 };
  }
  if (sortWay === 'updateNumAt') {
    sortWayResult = { updateNumAt: 1 };
  }
  if (sortWay === '-publishAt') {
    sortWayResult = { publishAt: -1, msgIdx: 1 };
  }
  if (sortWay === 'publishAt') {
    sortWayResult = { publishAt: 1, msgIdx: 1 };
  }

  let promise = Promise.resolve();
  if (category) {
    promise = promise.then(() => {
      return Category.findOne({ _id: category }).then(category => {
        if (!category) return;
        query.msgBiz = { $in: category.msgBizs };
      });
    });
  }
  return promise.then(() => {
    return Post.find(query).sort(sortWayResult).populate('profile').paginate(req.query).then(result => {
      const data = result.data;
      const metadata = {
        options: result.options,
        perPage: result.options.perPage,
        currentPage: result.current,
        next: result.next,
        prev: result.prev,
        totalPages: result.totalPages,
        count: result.count
      };
      res.json({
        metadata,
        data
      });
    });
  }).catch(e => {
    next(e);
  });
});

api.get('/profiles', (req, res, next) => {
  const {
    target,
    category,
    q
  } = req.query;

  let query = {};
  if (target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  if (q) query.title = new RegExp(q, 'i');
  let promise = Promise.resolve();
  if (category) {
    promise = promise.then(() => {
      return Category.findOne({ _id: category }).then(category => {
        if (!category) return;
        query.msgBiz = { $in: category.msgBizs };
      });
    });
  }
  return promise.then(() => {
    return Profile.find(query).sort({ openHistoryPageAt: -1 }).paginate(req.query).then(result => {
      const data = result.data;
      const metadata = {
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
          metadata,
          data
        });
      });
    });
  }).catch(e => {
    next(e);
  });
});

api.get('/profile/:id', wrap(async (req, res) => {
  const { id } = req.params;
  let profile = await Profile.findById(id);
  profile = profile.toObject();

  // eslint-disable-next-line
  const { _id, __v, ...newProfile } = profile;
  profile = { id: _id, ...newProfile };
  res.json(profile);
}));

api.put('/profile/:id', wrap(async (req, res) => {
  const { params, query } = req;
  const { id } = params;
  const { property } = query;
  if (!property) throw new Error('请传入property参数');
  await Profile.findByIdAndUpdate(id, { property });
  res.send('ok');
}));

// 新建分类
api.post('/categories', (req, res, next) => {
  const { name, msgBizs } = req.query;
  if (!name || !msgBizs) return next(new Error('请传入正确的参数'));
  Category.findOne({ name: name }).then(category => {
    if (category) return next(new Error('已存在同名称分类'));
    category = new Category({
      name,
      msgBizs: msgBizs.split(',')
    });
    return category.save();
  }).then(() => {
    res.status(201).send('创建分类成功');
  }).catch(e => {
    next(e);
  });
});

api.get('/categories', (req, res, next) => {
  Category.find({}).populate('profiles').then(categories => {
    res.json(categories);
  }).catch(e => {
    next(e);
  });
});

module.exports = api;
