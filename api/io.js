'use strict';
const io = require('../server').io;
const rp = require('request-promise');

function sendPostsData() {
  rp('http://localhost:8104/wechat-data-api/posts?=&sortWay=-updateNumAt&perPage=1').then(data => {
    io.emit('message', JSON.parse(data).data);
  });
}

exports.sendPostsData = sendPostsData;