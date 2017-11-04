'use strict';
const io = require('../server').io;
const rp = require('request-promise');

function sendPostsData() {
  rp('http://localhost:8004/api/posts?=&sortWay=-updateNumAt').then(data => {
    io.emit('message', data);
  });
}

exports.sendPostsData = sendPostsData;