'use strict';

require('./connect');
const mongoose = require('mongoose');

// 数据结构：公众号账号
const Profile = new mongoose.Schema({
  title: String,
  wechatId: String,
  desc: String,
  msgBiz: String,
  headimg: String
});

Profile.plugin(require('mongoose-timestamp'));

module.exports = mongoose.model('Profile', Profile);
