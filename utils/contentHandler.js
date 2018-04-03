'use strict';

const cheerio = require('cheerio');
const rp = require('request-promise');

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
    if (!this.body) await this.getBody();
    const $ = cheerio.load(this.body, { decodeEntities: false });
    return $('#js_content');
  }

  async getBody() {
    this.body = await rp(this.link);
  }

};
