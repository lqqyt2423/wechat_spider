'use strict';

const url = require('url');
const cheerio = require('cheerio');
const rp = require('request-promise');
const helper = require('./helper');

const bizRegExp = /var biz = .*?(M\w+==)/;
const midRegExp = /var mid = .*?"(\d+)"/;
const idxRegExp = /var idx = .*?"(\d)"/;

module.exports = class ContentHandler {

  constructor(options = {}) {
    const { link, body } = options;
    if (!link && !body) throw new Error('至少传入link或body');
    this.link = link;
    this.body = body;
    this.text = '';
    this.html = '';
  }

  /**
   * 获取微信正文html
   * @api public
   */
  async toHtml() {
    if (this.html) return this.html;
    this.html = (await this.parseBodyToHtml()).html().trim() || '';
    return this.html;
  }

  /**
   * 获取微信正文text
   * @api public
   */
  async toText() {
    if (this.text) return this.text;
    this.text = (await this.parseBodyToHtml()).text().trim() || '';
    return this.text;
  }

  async parseBodyToHtml() {
    const body = await this.getBody();
    const $ = cheerio.load(body, { decodeEntities: false });
    return $('#js_content');
  }

  async getBody() {
    if (this.body) return this.body;
    this.body = await rp(this.link);
    return this.body;
  }

  // 解析 msgBiz, msgMid, msgIdx
  async getIdentifying() {
    let msgBiz, msgMid, msgIdx;

    // 尝试解析链接
    if (this.link) {
      const urlObj = url.parse(helper.escape2Html(this.link), true);
      const { query: urlParams = {} } = urlObj;
      msgBiz = urlParams.__biz;
      msgMid = urlParams.mid;
      msgIdx = urlParams.idx;
    }

    // 无链接或为短链接时，则需要解析正文
    if (!msgBiz || !msgMid || !msgIdx) {
      const body = await this.getBody();
      if (bizRegExp.test(body)) msgBiz = body.match(bizRegExp)[1];
      if (midRegExp.test(body)) msgMid = body.match(midRegExp)[1];
      if (idxRegExp.test(body)) msgIdx = body.match(idxRegExp)[1];
    }

    return { msgBiz, msgMid, msgIdx };
  }
};
