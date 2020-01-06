'use strict';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function random(min, max) {
  if (max === min) return max;
  if (max < min) [min, max] = [max, min];
  return Math.round(Math.random() * (max - min) + min);
}

function rsleep(min, max) {
  const ms = random(min, max);
  return sleep(ms);
}

// html 字符串转义
function escape2Html(str) {
  const obj = {
    'lt': '<',
    'gt': '>',
    'nbsp': ' ',
    'amp': '&',
    'quot': '"'
  };
  return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, (_, t) => obj[t]);
}

module.exports = {
  sleep,
  random,
  rsleep,
  escape2Html,
};
