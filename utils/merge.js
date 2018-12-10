'use strict';

const merge = (target, source) => {
  const keys = Object.keys(target);
  keys.forEach(k => {
    if (source.hasOwnProperty(k)) {
      if (Object.prototype.toString.call(source[k]) === '[object Object]') {
        merge(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
    }
  });
};

module.exports = merge;
