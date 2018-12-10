'use strict';

// 包装 api handler
function wrap(fn) {
  return function (req, res, next) {
    fn.call(this, req, res, next).catch(next);
  };
}

module.exports = wrap;
