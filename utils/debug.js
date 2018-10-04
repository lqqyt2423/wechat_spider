'use strict';

const debugFn = require('debug');

module.exports = function debug(name) {
  name = 'ws:' + name;
  const fn = debugFn(name);
  return function(...args) {
    if (!args.length) return console.log();
    if (args.length === 1 && args[0] === '') return console.log();
    fn(...args);
  };
};
