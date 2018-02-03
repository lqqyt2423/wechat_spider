'use strict';

/**
 * Pagination Plugin
 */
const util = require('util');
const Query = require('mongoose').Query;

const defaults = {
  perPage: 20, // 每页条数
  page   :  1, // 初始页数
  offset :  0,  // 偏移数
  maxPerPage: 100 // 最大单页条数
};

/**
 * paginate
 *
 * @param {Object} options
 */
Query.prototype.paginate = function(options, callback) {
  let opts = util._extend({}, defaults);
  opts = util._extend(opts, options);

  // 转换值为数字
  Object.keys(defaults).forEach(function(k) {
    opts[k] = Number(opts[k]);
  });

  let query = this;
  let model = query.model;
  let conditions = query._conditions;

  return new Promise(function(resolve, reject) {
    model.count(conditions, function(err, count) {

      opts.perPage = opts.perPage >= opts.maxPerPage ? opts.maxPerPage : opts.perPage;

      let _skip = (opts.page - 1) * opts.perPage;
      _skip += opts.offset;

      query.skip(_skip).limit(opts.perPage).exec(function(err, data) {
        if (err) {
          typeof callback === 'function' ? reject(callback(err)) : reject(err);
          return;
        }

        data = data || [];

        let current = parseInt(opts.page, 10) || 1;

        let offsetCount = count - opts.offset;
        offsetCount = offsetCount > 0 ? offsetCount : 0;

        let totalPages = Math.ceil(offsetCount / opts.perPage);

        let prev = !count || current === 1 ? null : current - 1;
        let next = !count || current === totalPages ? null : current + 1;

        if (!offsetCount) {
          prev = next = null;
        }

        let pager = {
          data: data,
          options: opts,
          current: current,
          next: next,
          prev: prev,
          totalPages: totalPages,
          count: count
        };

        typeof callback === 'function' ? resolve(callback(err, pager)) : resolve(pager);
      });
    });
  });
};
