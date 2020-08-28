'use strict';

/**
 * Pagination Plugin
 */
const _ = require('lodash');
const Query = require('mongoose').Query;

const DEFAULTS = {
  perPage: 10, // 每页条数
  page: 1, // 初始页数
  offset: 0,  // 偏移数
  maxPerPage: 100 // 最大单页条数
};
const DEFAULT_KEYS = Object.keys(DEFAULTS);

/**
 * paginate
 *
 * @param {Object} options
 */
Query.prototype.paginate = async function (options, callback) {
  let opts = _.assign({}, DEFAULTS, options);

  // 转换值为数字
  DEFAULT_KEYS.forEach(k => opts[k] = Number(opts[k]));

  let hasCallback = typeof callback === 'function';

  let query = this;
  let model = query.model;
  let conditions = query._conditions;

  // 如果有外部传递过来的count，无需查数据库
  let count = opts.count || 0;

  try {
    if (!count) count = await model.where(conditions).countDocuments();

    // 计算每页数
    opts.perPage = opts.perPage >= opts.maxPerPage ? opts.maxPerPage : opts.perPage;

    let _skip = (opts.page - 1) * opts.perPage;
    _skip += opts.offset;

    let data = await query.skip(_skip).limit(opts.perPage);

    let current = parseInt(opts.page, 10) || 1;

    let offsetCount = count - opts.offset;
    offsetCount = offsetCount > 0 ? offsetCount : 0;

    let totalPages = Math.ceil(offsetCount / opts.perPage);

    let prev = !count || current === 1 ? null : current - 1;
    let next = !count || current === totalPages ? null : current + 1;

    if (!offsetCount) prev = next = null;

    let result = {
      data: data || [],
      options: opts,
      current: current,
      next: next,
      prev: prev,
      totalPages: totalPages,
      count: count,

      // 直接返回给前端的 metadata
      metadata: {
        count,
        totalPages,
        currentPage: current,
        perPage: opts.perPage,
      },
    };

    return hasCallback ? callback(null, result) : result;
  } catch (e) {
    if (hasCallback) {
      callback(e);
    } else {
      throw e;
    }
  }
};
