'use strict';

const models = require('../models');
const json2csv = require('json2csv');
const moment = require('moment');

const profileMap = {
  公众号: 'title',
  公众号ID: 'wechatId',
  公众号属性: 'property'
};

const postMap = {
  msgBiz: 'msgBiz',
  标题: 'title',
  链接: 'link',
  发布时间: 'publishAt',
  发布位置: 'msgIdx',
  阅读量: 'readNum',
  点赞量: 'likeNum',
  摘要: 'digest',
  封面: 'cover',
  内容: 'content',
  阅读原文: 'sourceUrl'
};

module.exports = class ExportData {

  constructor(options = {}) {
    const { msgBiz, category } = options;
    this.msgBiz = [];
    this.category = [];
    this.shouldGetMsgBiz = false;
    this.bizCategoryNameMap = {};

    if (msgBiz) this.msgBiz = this.msgBiz.concat(msgBiz);
    if (category) this.category = this.category.concat(category);
    if (this.msgBiz.length === 0 && this.category.length === 0) throw new Error('请传入参数');
    if (this.category.length > 0) this.shouldGetMsgBiz = true;
  }

  /**
   * 导出为json字符串
   * @param {Date} minDate 
   * @param {Date} maxDate 
   * @param {Object} options 
   * @return {String}
   * @api public
   */
  async toJson(minDate, maxDate, options = {}) {
    const posts = await this.findPosts(minDate, maxDate);
    const keys = Object.keys(profileMap).concat(Object.keys(postMap));

    let replacer = null;
    const optionKeys = Object.keys(options);
    if (optionKeys.length > 0) {
      // 传入的key必须得在keys中存在
      const isContain = optionKeys.every(key => keys.indexOf(key) > -1);
      if (!isContain) throw new Error('确保格式化字段传入正确');

      // 确保value全为1或全为-1
      const onlyOrExcept = options[optionKeys[0]];
      const isAllow = optionKeys.every(key => options[key] === onlyOrExcept);
      if (!isAllow) throw new Error('确保value全为1或全为-1');

      // 更改replacer
      replacer = keys.filter(key => {
        if (onlyOrExcept === 1) return (optionKeys.indexOf(key) > -1);
        return (optionKeys.indexOf(key) === -1);
      });
    }

    return JSON.stringify(posts, replacer, 4);
  }

  /**
   * 导出为csv字符串
   * @param {Date} minDate 
   * @param {Date} maxDate 
   * @param {Object} options 
   * @return {String}
   * @api public
   */
  async toCsv(minDate, maxDate, options = {}) {
    const json = await this.toJson(minDate, maxDate, options);
    const obj = JSON.parse(json);
    let csv = json2csv({ data: obj });
    csv = addBom(csv);
    return csv;
  }

  /**
   * 导出统计信息json字符串
   * @param {Date} minDate 
   * @param {Date} maxDate 
   * @return {String}
   * @api public
   */
  async toStaJson(minDate, maxDate) {
    const data = await this.calcStatistic(minDate, maxDate);
    return JSON.stringify(data, null, 4);
  }

  /**
   * 导出统计信息csv字符串
   * @param {Date} minDate 
   * @param {Date} maxDate 
   * @return {String}
   * @api public
   */
  async toStaCsv(minDate, maxDate) {
    const data = await this.calcStatistic(minDate, maxDate);
    let csv = json2csv({ data });
    csv = addBom(csv);
    return csv;
  }

  /**
   * 查找文章
   * @api private
   */
  async findPosts(minDate, maxDate) {
    if (this.shouldGetMsgBiz) await this.getMsgBiz();
    const posts = await models.Post.find({
      msgBiz: { $in: this.msgBiz },
      publishAt: { $gte: minDate, $lt: maxDate },
      isFail: { $ne: true }
    }).sort({ msgBiz: 1, publishAt: 1, msgIdx: 1 }).populate('profile');

    const handledPosts = posts.map(post => {
      const { profile, msgBiz } = post;
      const postObj = {};
      
      // 分类
      const category = this.bizCategoryNameMap[msgBiz];
      if (category) postObj.分类 = category;

      // 公众号信息
      Object.keys(profileMap).forEach(key => {
        const value = profile[profileMap[key]];
        if (value) postObj[key] = value;
      });

      // 文章信息
      Object.keys(postMap).forEach(key => {
        const value = post[postMap[key]];
        if (value) postObj[key] = value;

        // 时间格式转换
        if (key === '发布时间' && Object.prototype.toString.call(value) == '[object Date]') postObj[key] = moment(value).format('YYYY-MM-DD HH:mm');
      });

      // 用0替换undefined
      if (!postObj.阅读量) postObj.阅读量 = 0;
      if (!postObj.点赞量) postObj.点赞量 = 0;

      return postObj;
    });

    return handledPosts;
  }

  /**
   * 计算统计信息
   * @api private
   */
  async calcStatistic(...args) {
    const json = await this.toJson(...args);
    const data = JSON.parse(json);
    let aggrObj = {};
    let aggrArray = [];
    data.forEach(item => {
      let key = item.msgBiz;
      if (key in aggrObj) {
        aggrObj[key].总阅读量 += item.阅读量 || 0;
        aggrObj[key].总点赞量 += item.点赞量 || 0;
        aggrObj[key].总发文数 += 1;
        if (item.发布位置 == '1') {
          aggrObj[key].头条总阅读量 += item.阅读量 || 0;
          aggrObj[key].头条总点赞量 += item.点赞量 || 0;
          aggrObj[key].推送次数 += 1;
        }
        if (item.阅读量 > aggrObj[key].单篇最高阅读量) {
          aggrObj[key].单篇最高阅读量 = item.阅读量;
        }
      } else {
        aggrObj[key] = {
          分类: item.分类,
          公众号属性: item.公众号属性,
          公众号: item.公众号,
          公众号ID: item.公众号ID,
          总阅读量: item.阅读量 || 0,
          总点赞量: item.点赞量 || 0,
          总发文数: 1,
          头条总阅读量: 0,
          头条总点赞量: 0,
          推送次数: 0,
          单篇最高阅读量: item.阅读量 || 0
        };
        if (item.发布位置 == '1') {
          aggrObj[key].头条总阅读量 = item.阅读量 || 0;
          aggrObj[key].头条总点赞量 = item.点赞量 || 0;
          aggrObj[key].推送次数 = 1;
        }
      }
    });
    Object.keys(aggrObj).forEach(key => {
      let item = aggrObj[key];
      let 公众号 = item.公众号;
      aggrArray.push({
        公众号: 公众号,
        公众号ID: item.公众号ID,
        分类: item.分类,
        公众号属性: item.公众号属性,
        msgBiz: key,
        总阅读量: item.总阅读量,
        平均阅读量: Math.round(item.总阅读量 / item.总发文数),
        头条总阅读量: item.头条总阅读量,
        推送次数: item.推送次数,
        总点赞量: item.总点赞量,
        平均点赞量: Math.round(item.总点赞量 / item.总发文数),
        头条总点赞量: item.头条总点赞量,
        单篇最高阅读量: item.单篇最高阅读量,
        总发文数: item.总发文数
      });
    });
    return aggrArray;
  }

  /**
   * 通过category获取msgbizs
   * @api private
   */
  async getMsgBiz() {
    const categories = await models.Category.find({ _id: { $in: this.category } });
    if (!(categories && categories.length)) return;

    categories.forEach(category => {
      const { name, msgBizs } = category;

      // 找到所有的msgBiz都加入进来
      this.msgBiz = this.msgBiz.concat(msgBizs);

      // 添加msgBiz和分类名称的映射
      msgBizs.forEach(msgBiz => {
        this.bizCategoryNameMap[msgBiz] = name;
      });
    });
  }

};

function addBom(csv) {
  const bom = Buffer.from('\uFEFF');
  const csvBuf = Buffer.from(csv);
  return Buffer.concat([bom, csvBuf]).toString();
}
