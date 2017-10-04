const express = require('express');
const api = express.Router();
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const config = require('../config').insertJsToNextProfile;

api.get('/', (req, res, next) => {
  let query = {};
  if (req.query.target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  if (req.query.mainData === 'true') {
    query.readNum = { $exists: true };
  }
  if (req.query.mainData === 'false') {
    query.readNum = { $exists: false };
  }
  return Post.find(query).sort({ updatedAt: -1 }).populate('profile').paginate(req.query).then(result => {
    let data = result.data;
    let metadata = {
      options: result.options,
      current: result.current,
      next: result.next,
      prev: result.prev,
      totalPages: result.totalPages,
      count: result.count
    };
    res.json({
      metadata: metadata,
      data: data
    });
  })
})

api.get('/profile', (req, res, next) => {
  let query = {};
  if (req.query.target === 'true') {
    query.msgBiz = { $in: config.targetBiz };
  }
  return Profile.find(query).sort({ openHistoryPageAt: 1 }).paginate(req.query).then(result => {
    let data = result.data;
    let metadata = {
      options: result.options,
      current: result.current,
      next: result.next,
      prev: result.prev,
      totalPages: result.totalPages,
      count: result.count
    };
    res.json({
      metadata: metadata,
      data: data
    });
  })
})

module.exports = api;