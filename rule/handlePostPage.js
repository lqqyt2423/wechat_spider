'use strict';

const url = require('url');
const models = require('../models');
const logger = require('../utils/logger');
const config = require('../config');
const { getNextPostLink, debugInfo } = require('./postLink');
const { getPostDetail } = require('./savePostsData');

const { rule: ruleConfig } = config;
const {
  isReplacePostBody,
  isCrawlComments,
  page: pageConfig,
} = ruleConfig;

// 获取文章详情页阅读量和点赞量
const getReadAndLikeNum = async function (ctx) {
  const { req, res } = ctx;

  const body = res.response.body.toString();
  const data = JSON.parse(body);
  const { read_num, like_num, old_like_num } = data.appmsgstat;
  const [readNum, likeNum2, likeNum] = [read_num, like_num, old_like_num];

  const { requestData } = req;
  const reqData = String(requestData);
  const reqArgs = reqData.split('&').map(s => s.split('='));
  const reqObj = reqArgs.reduce((obj, arr) => {
    const [key, value] = arr;
    obj[key] = decodeURIComponent(value);
    return obj;
  }, {});
  const { __biz, mid, idx } = reqObj;
  const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];

  const post = await models.Post.findOneAndUpdate(
    { msgBiz, msgMid, msgIdx },
    { readNum, likeNum, likeNum2, updateNumAt: new Date() },
    { new: true, upsert: true }
  );

  logger.info('[获取文章阅读点赞] id: %s, title: %s, 阅读: %s, 赞: %s, 在看: %s', post.id, post.title, readNum, likeNum, likeNum2);
  logger.info(await debugInfo());
};

// 保存文章的基本信息，也可以直接通过 HTTP 请求处理
const getPostBasicInfo = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  const body = res.response.body.toString();

  await getPostDetail(link, body);
};

// 注入控制代码至手机前端，实现功能：
//   手机上文章正文显示自定义
//   自动跳转至下一文章详情页
const handlePostHtml = async function (ctx) {
  const { res } = ctx;
  const { response } = res;
  let body = response.body.toString();

  // 替换显示在手机上的正文 加速网络
  if (isReplacePostBody) {
    const info = await debugInfo();
    body = body.replace(/(<div class="rich_media_content " id="js_content".*?>)((?:\s|\S)+?)(<\/div>\s+?<script nonce=)/, (_, a, b, c) => {
      return `${a}${info}${c}`;
    });
  }

  // 加入meta head控制自动翻页
  if (!pageConfig.disable) {
    let nextLink = await getNextPostLink();

    // 是否暂时抓取完成了，如果暂时抓取完成了，逻辑最终为刷新当前链接
    // 所以判断此字段，设置刷新的频率慢一些
    let isTmpFinished = false;

    if (!nextLink) {
      logger.warn('所有文章已经抓取完毕');

      // 如果文章已经抓取完了，就取当前页面的链接作为下次的跳转，相当于刷新页面
      // 目的是为了保持下次有新的链接时，保持事件的响应
      nextLink = ctx.req.url;
      isTmpFinished = true;
    }

    let interval = pageConfig.jumpInterval;
    if (isTmpFinished) interval = interval * 5;

    const insertJsStr = '<meta http-equiv="refresh" content="' + interval + ';url=' + nextLink + '" />';
    body = body.replace('</title>', '</title>' + insertJsStr);
  }

  response.body = body;

  // 禁止缓存
  response.header['Expires'] = 0;
  response.header['Cache-Control'] = 'no-cache, no-store, must-revalidate';

  return { response };
};

// 保存文章留言
const getComments = async function (ctx) {
  if (!isCrawlComments) return;

  const { req, res } = ctx;
  const link = req.url;

  const body = res.response.body.toString();
  const data = JSON.parse(body);

  const comments = data.elected_comment;
  if (!(comments && comments.length)) return;

  const urlObj = url.parse(link, true);
  const { query } = urlObj;
  const { __biz, appmsgid, idx } = query;
  const [msgBiz, msgMid, msgIdx] = [__biz, appmsgid, idx];

  const postId = await models.Post.findOne({ msgBiz, msgMid, msgIdx }).then(post => {
    if (post) return post._id;
  });
  if (!postId) return;

  const postComments = comments.map(comment => {
    const contentId = comment.content_id;
    const nickName = comment.nick_name;
    const logoUrl = comment.logo_url;
    const content = comment.content;
    const createTime = new Date(comment.create_time * 1000);
    const likeNum = comment.like_num;
    const reply = comment.reply;
    let replies = [];
    if (reply && reply.reply_list && reply.reply_list.length) {
      replies = reply.reply_list.map(rep => {
        return {
          content: rep.content,
          createTime: new Date(rep.create_time * 1000),
          likeNum: rep.reply_like_num
        };
      });
    }
    return {
      contentId,
      postId,
      nickName,
      logoUrl,
      content,
      createTime,
      likeNum,
      replies,
    };
  });

  await Promise.all(postComments.map(comment => {
    return models.Comment.findOneAndUpdate(
      { contentId: comment.contentId },
      { ...comment },
      { upsert: true }
    );
  }));

  logger.info(`已抓取${postComments.length}条评论`);
};

module.exports = {
  getReadAndLikeNum,
  getPostBasicInfo,
  handlePostHtml,
  getComments,
};
