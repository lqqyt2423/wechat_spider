const express = require('express');
const api = express.Router();
const Profile = require('../models/Profile');
const Post = require('../models/Post');

api.get('/', (req, res, next) => {
  let promise = Promise.resolve();
  promise = promise.then(() => {
    return Post.find();
  });
  return promise.then(posts => {
    if (posts.length === 0) return next();
    return Promise.all(posts.map(post => {
      return Profile.findOne({ msgBiz: post.msgBiz }).then(profile => {
        if (profile) {
          // _doc
          post._doc.profile = profile;
        }
        return post;
      })
    })).then(posts => {
      return res.json(posts);
    });
  });
});

module.exports = api;