'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Comment = new Schema({
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

mongoose.model('Comment', Comment);
