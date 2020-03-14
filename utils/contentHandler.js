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

  // 获取文章详情数据
  async getDetail() {
    const { msgBiz, msgMid, msgIdx } = await this.getIdentifying();
    if (!msgBiz || !msgMid || !msgIdx) return null;

    const doc = { msgBiz, msgMid, msgIdx };
    const body = await this.getBody();

    // 判断此文是否失效
    if (body.includes('global_error_msg') || body.includes('icon_msg warn')) {
      doc.isFail = true;
      return doc;
    }

    // 从 html 中提取必要信息
    const getTarget = regexp => {
      let target = '';
      body.replace(regexp, (_, t) => {
        target = t;
      });
      return target;
    };

    let wechatId = getTarget(/<span class="profile_meta_value">(.+?)<\/span>/);
    const username = getTarget(/var user_name = "(.+?)"/);
    // 如果上面找到的微信id中包含中文字符 则证明此微信号没有设置微信id 则取微信给定的 username 初始字段
    if (wechatId && /[\u4e00-\u9fa5]/.test(wechatId)) {
      wechatId = username;
    }
    const title = getTarget(/var msg_title = "(.+?)";/);
    let publishAt = getTarget(/var ct = "(\d+)";/);
    if (publishAt) publishAt = new Date(parseInt(publishAt) * 1000);
    const sourceUrl = getTarget(/var msg_source_url = '(.*?)';/);
    const cover = getTarget(/var msg_cdn_url = "(.+?)";/);
    const digest = getTarget(/var msg_desc = "(.+?)";/);

    // 公众号头像
    const headimg = getTarget(/var hd_head_img = "(.+?)"/);
    const nickname = getTarget(/var nickname = "(.+?)"/);

    return {
      ...doc,
      wechatId,
      username,
      title,
      publishAt,
      sourceUrl,
      cover,
      digest,
      headimg,
      nickname,
    };
  }
};
