'use strict';

require('./connect');
const mongoose = require('mongoose');

const Comment = new mongoose.Schema({
  postId: { type: 'ObjectId', ref: 'Post' },
  contentId: String,
  nickName: String,
  logoUrl: String,
  content: String,
  createTime: Date,
  likeNum: Number,
  replies: [{
    content: String,
    createTime: Date,
    likeNum: Number
  }]
});

Comment.plugin(require('mongoose-timestamp'));

module.exports = mongoose.model('Comment', Comment);
