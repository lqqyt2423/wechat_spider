'use strict';

const url = require('url');
const cheerio = require('cheerio');
const rp = require('request-promise');
const helper = require('./helper');

function getIdentifyingFromLink(link) {
  const urlObj = url.parse(helper.escape2Html(link), true);
  const { query: { __biz: msgBiz, mid: msgMid, idx: msgIdx } } = urlObj;
  return { msgBiz, msgMid, msgIdx };
}

module.exports = class ContentHandler {

  constructor(options = {}) {
    const { link, body } = options;
    if (!link && !body) throw new Error('至少传入link或body');
    this.link = link;
    this.body = body;

    this._identifying = null;

    // cheerio instance
    this.$html = null;

    this.text = '';
    this.html = '';

    // normal: 正常文章
    // image: 图片类型
    this._type = 'normal';
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

  async get$Html() {
    if (this.$html) return this.$html;
    const body = await this.getBody();
    this.$html = cheerio.load(body, { decodeEntities: false });
    return this.$html;
  }

  async parseBodyToHtml() {
    const $ = await this.get$Html();
    return $('#js_content');
  }

  async getBody() {
    if (this.body) return this.body;
    this.body = await rp(this.link);
    return this.body;
  }

  // 解析 msgBiz, msgMid, msgIdx
  async getIdentifying() {
    if (this._identifying) return this._identifying;

    let msgBiz, msgMid, msgIdx;

    // 尝试解析链接
    if (this.link) {
      ({ msgBiz, msgMid, msgIdx } = getIdentifyingFromLink(this.link));
    }

    // 无链接或为短链接时，则需要解析正文
    if (!msgBiz || !msgMid || !msgIdx) {
      const $ = await this.get$Html();
      const urlMeta = $('meta[property="og:url"]').attr();
      if (urlMeta && urlMeta.content) {
        ({ msgBiz, msgMid, msgIdx } = getIdentifyingFromLink(urlMeta.content));
      }
    }

    this._identifying = { msgBiz, msgMid, msgIdx };

    return this._identifying;
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

    if (!wechatId) {
      // 图片类型，单独处理
      if (body.includes('id="img_list"')) {
        this._type = 'image';
        return await this.getImageDetail(doc, body);
      }
    }

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

  // 图片类型，获取详情数据
  async getImageDetail(doc, body) {
    const getTarget = regexp => {
      let target = '';
      body.replace(regexp, (_, t) => {
        target = t;
      });
      return target;
    };

    const username = getTarget(/d.user_name = "(.+?)"/);
    const title = getTarget(/d.title = "(.+?)"/);
    let publishAt = getTarget(/d.ct = "(\d+)";/);
    if (publishAt) publishAt = new Date(parseInt(publishAt) * 1000);

    const $ = await this.get$Html();
    const cover = ($('#img_list img').attr() || {}).src;

    const headimg = getTarget(/d.hd_head_img = "(.+?)"/);
    const nickname = getTarget(/d.nick_name = "(.+?)"/);

    return {
      ...doc,
      username,
      title,
      publishAt,
      cover,
      headimg,
      nickname,
    };
  }
};
