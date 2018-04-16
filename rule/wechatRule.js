'use strict';

const url = require('url');
const moment = require('moment');
const models = require('../models');
const { log } = console;
const config = require('../config');
const cheerio = require('cheerio');
const redis = require('../utils/redis');

// 链接数组的缓存 每次重启程序后都会清空
const { POST_LIST_KEY, PROFILE_LIST_KEY } = config.redis;

const getReadAndLikeNum = async function(ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/mp\/getappmsgext/.test(link)) return;

  try {
    const body = res.response.body.toString();
    const data = JSON.parse(body);
    const { read_num, like_num } = data.appmsgstat;
    const [readNum, likeNum] = [read_num, like_num];

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
      { readNum, likeNum, updateNumAt: new Date() },
      { new: true, upsert: true }
    );
    const { id, title } = post;
    if (title) {
      log('文章标题:',title);
    } else {
      log('文章id:',id);
    }
    log('阅读量:', readNum, '点赞量:', likeNum);
    log();

    await redis('llen', POST_LIST_KEY).then(len => {
      log('剩余文章抓取长度:', len);
      log();
    });

  } catch(e) {
    throw e;
  }
};

const getPostBasicInfo = async function(ctx) {
  if (!isPostPage(ctx)) return;

  const { req, res } = ctx;
  const link = req.url;
  const body = res.response.body.toString();

  const urlObj = url.parse(link, true);
  const { query } = urlObj;
  const { __biz, mid, idx } = query;
  const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];

  // 判断此文是否失效
  if (body.indexOf('global_error_msg') > -1 || body.indexOf('icon_msg warn') > -1) {
    await models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { isFail: true },
      { upsert: true }
    );
    return;
  }


  // 若数据库中不存在此篇文章 则更新基础信息
  await models.Post.findOne({ msgBiz, msgMid, msgIdx }).then(post => {
    if (post && post.title && post.link && post.wechatId) return;

    const getTarget = regexp => {
      let target;
      body.replace(regexp, (_, t) => {
        target = t;
      });
      return target;
    };

    let wechatId = getTarget(/<span class="profile_meta_value">(.+?)<\/span>/);
    // 如果上面找到的微信id中包含中文字符 则证明此微信号没有设置微信id 则取微信给定的user_name初始字段
    if (wechatId && /[\u4e00-\u9fa5]/.test(wechatId)) {
      wechatId = getTarget(/var user_name = "(.+?)"/);
    }

    // 更新wechatId
    if (wechatId && post && (!post.wechatId) && post.title && post.link) {
      return models.Post.findOneAndUpdate(
        { msgBiz, msgMid, msgIdx },
        { wechatId },
        { upsert: true }
      );
    }

    const title = getTarget(/var msg_title = "(.+?)";/);
    let publishAt = getTarget(/var ct = "(\d+)";/);
    if (publishAt) publishAt = new Date(parseInt(publishAt) * 1000);
    const sourceUrl = getTarget(/var msg_source_url = '(.*?)';/);
    const cover = getTarget(/var msg_cdn_url = "(.+?)";/);
    const digest = getTarget(/var msg_desc = "(.+?)";/);

    return models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { title, link, publishAt, sourceUrl, cover, digest, wechatId },
      { upsert: true }
    );
  });

  // 保存正文内容
  if (config.insertJsToNextPage.isSavePostContent) {
    const $ = cheerio.load(body, { decodeEntities: false });
    let content;
    if (config.insertJsToNextPage.saveContentType === 'html') {
      content = $('#js_content').html() || '';
    } else {
      content = $('#js_content').text() || '';
    }
    content = content.trim();
    await models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { content },
      { upsert: true }
    );
  }

};

const handlePostHtml = async function(ctx) {
  if (!isPostPage(ctx)) return;

  const { res } = ctx;
  let body = res.response.body.toString();

  // 替换显示在手机上的正文 加速网络
  if (config.isReplacePostBody) {
    const len = await redis('llen', POST_LIST_KEY);
    body.replace(/<div class="rich_media_content " id="js_content">((\s|\S)+?)<\/div>\s+?<script nonce=/, (_, content) => {
      if (content) body = body.replace(content, `剩余文章抓取长度: ${len}`);
    });
  }

  // 加入meta head控制自动翻页
  if (!config.insertJsToNextPage.disable) {
    const nextLink = await getNextPostLink();
    if (!nextLink) {
      log('所有文章已经抓取完毕');
      log();
    } else {
      const insertJsStr = '<meta http-equiv="refresh" content="' + config.insertJsToNextPage.jumpInterval + ';url=' + nextLink + '" />';
      body = body.replace('</title>', '</title>' + insertJsStr);
    }
    
  }

  return {
    response: { ...res.response, body }
  };
};

const getComments = async function(ctx) {
  if (!config.isCrawlComments) return;

  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/appmsg_comment/.test(link)) return;

  try {
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

    log(`已抓取${postComments.length}条评论`);
    log();

  } catch(e) {
    throw e;
  }
};

const getProfileBasicInfo = async function(ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/profile_ext\?action=home&__biz=/.test(link)) return;

  const body = res.response.body.toString();

  const getTarget = regexp => {
    let target;
    body.replace(regexp, (_, t) => {
      target = t;
    });
    return target;
  };

  const urlObj = url.parse(link, true);
  const msgBiz = urlObj.query.__biz;
  const title = getTarget(/var nickname = "(.+?)"/);
  const headimg = getTarget(/var headimg = "(.+?)"/);

  // 更新微信号基础信息
  await models.Profile.findOneAndUpdate(
    { msgBiz },
    { title, headimg, openHistoryPageAt: new Date() },
    { upsert: true }
  );

  const content = getTarget(/var msgList = '(.+)';\n/);

  if (!content) return;

  // 字符串转义
  const escape2Html = str => {
    const obj = {
      'lt': '<',
      'gt': '>',
      'nbsp': ' ',
      'amp': '&',
      'quot': '"'
    };
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, (_, t) => obj[t]);
  };

  try {
    const data = JSON.parse(escape2Html(content).replace(/\\\//g,'/'));
    const postList = data.list;
    await savePostsData(postList);
  } catch(e) {
    throw e;
  }
};

const getPostList = async function(ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/profile_ext\?action=getmsg&__biz=/.test(link)) return;

  const body = res.response.body.toString();

  try {
    const data = JSON.parse(body);
    const postList = JSON.parse(data.general_msg_list).list;
    await savePostsData(postList);
  } catch(e) {
    throw e;
  }
};

const handleProfileHtml = async function(ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/profile_ext\?action=home&__biz=/.test(link)) return;

  const { insertJsToNextProfile } = config;
  let { disable, onlyScroll, minTime, jumpInterval } = insertJsToNextProfile;
  if (disable && !onlyScroll) return;

  let jumpJsStr = '';
  if (!disable) {
    const nextLink = await getNextProfileLink();
    if (!nextLink) {
      log('所有公众号已经抓取完毕');
      log();
    } else {
      // 控制页面跳转
      jumpJsStr = `
  const refreshMeta = document.createElement('meta');
  refreshMeta.httpEquiv = 'refresh';
  refreshMeta.content = '${jumpInterval};url=${nextLink}';
  document.head.appendChild(refreshMeta);
`;
    }
  }

  const scrollInterval = jumpInterval * 1000;

  // 最小时间再减一天 保证抓到的文章一定齐全
  minTime = new Date(minTime).getTime() - 1000 * 60 * 60 * 24;

  let body = res.response.body.toString();

  // 根据抓取时间和公众号的抓取结果 判断是否下拉和页面跳转
  const insertJsStr = `<script type="text/javascript">
  (function() {
    window.addEventListener('load', () => {
      const isScroll = time => {
        const text = document.body.innerText;

        const tmpArray = text.split(/(.{4})年(.{1,2})月(.{1,2})日/);
        const tmpStr = tmpArray[tmpArray.length - 1];
        if (tmpStr.indexOf('已无更多') > -1) return false;
        if (tmpStr.indexOf('接收更多消息') > -1) return false;

        let minDate;
        text.replace(/(.{4})年(.{1,2})月(.{1,2})日/g, (match, y, m, d) => {
          minDate = new Date(y, m - 1, d).getTime();
          minDateStr = match;
        });
        if (minDate && minDate < time) return false;
        return true;
      };

      const controlScroll = () => {
        if (isScroll(${minTime})) {
          window.scrollTo(0, document.body.scrollHeight);
          setTimeout(controlScroll, ${scrollInterval});
        } else {
          window.scrollTo(0, 0);
          ${jumpJsStr}
        }
      };

      controlScroll();
    });
  })();
</script>`;
  body = body.replace('<!--headTrap<body></body><head></head><html></html>-->','').replace('<!--tailTrap<body></body><head></head><html></html>-->','');
  body = body.replace('</body>',insertJsStr + '\n</body>');
  return {
    response: { ...res.response, body }
  };


  
};

async function savePostsData(postList) {
  const posts = [];
  postList.forEach(post => {
    const appMsg = post.app_msg_ext_info;
    if (!appMsg) return;
    const publishAt = new Date(post.comm_msg_info.datetime * 1000);
    posts.push({ appMsg, publishAt });

    const multiAppMsg = appMsg.multi_app_msg_item_list;
    if (!(multiAppMsg && multiAppMsg.length > 0)) return;
    multiAppMsg.forEach(appMsg => {
      posts.push({ appMsg, publishAt });
    });
  });

  await Promise.all(posts.map(post => {
    const { appMsg, publishAt } = post;
    const title = appMsg.title;
    const link = appMsg.content_url;
    if (!(title && link)) return;

    const urlObj = url.parse(link, true);
    const { query } = urlObj;
    let { __biz, mid, idx } = query;
    if (!mid) mid = query['amp;mid'];
    if (!idx) idx = query['amp;idx'];
    const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];

    const [ cover, digest, sourceUrl ] = [ appMsg.cover, appMsg.digest, appMsg.source_url ];

    return models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { title, link, publishAt, cover, digest, sourceUrl },
      { new: true, upsert: true }
    ).then(post => {
      log('发布时间:', post.publishAt ? moment(post.publishAt).format('YYYY-MM-DD HH:mm') : '');
      log('文章标题:', post.title, '\n');
    });
  }));

  await redis('llen', PROFILE_LIST_KEY).then(len => {
    log('剩余公众号抓取长度:', len);
    log();
  });
}

function isPostPage(ctx) {
  const { req } = ctx;
  const link = req.url;
  const isPost = /mp\.weixin\.qq\.com\/s\?__biz/.test(link);
  const isOldPost = /mp\/appmsg\/show/.test(link);
  if (!(isPost || isOldPost)) return false;
  return true;
}

// 文章跳转链接放在redis中
async function getNextPostLink() {
  // 先从redis中取链接
  let nextLink = await redis('lpop', POST_LIST_KEY);
  if (nextLink) return nextLink;

  // 没有拿到链接则从数据库中查
  const { insertJsToNextPage } = config;
  const { minTime, maxTime, isCrawlExist, targetBiz, crawlExistInterval } = insertJsToNextPage;

  const searchQuery = {
    isFail: null,
    link: { $exists: true },
    publishAt: { $gte: minTime, $lte: maxTime }
  };

  if (targetBiz && targetBiz.length > 0) searchQuery.msgBiz = { $in: targetBiz };

  if (!isCrawlExist) searchQuery.updateNumAt = null;

  const links = await models.Post.find(searchQuery).select('link publishAt updateNumAt').then(posts => {
    if (!(posts && posts.length > 0)) return [];

    // 根据config中的是否抓取已经抓去过的文章来判断逻辑
    if (!isCrawlExist) {
      return posts.map(post => post.link);
    } else {
      return posts.filter(post => {
        const { publishAt, updateNumAt } = post;
        if (!updateNumAt) return true;
        if (new Date(updateNumAt).getTime() - new Date(publishAt).getTime() > crawlExistInterval) {
          return false;
        } else {
          return true;
        }
      }).map(post => post.link);
    }
  });

  // 如果还查不到 则证明已经抓取完毕了 返回undefined
  if (links.length === 0) return;

  // 将从数据库中查到的链接放入redis中
  await redis('rpush', POST_LIST_KEY, links);

  // 再查一次就有下一个链接了
  return getNextPostLink();
}

// 公众号跳转链接放在redis中
async function getNextProfileLink() {
  // 先从redis中取链接
  let nextLink = await redis('lpop', PROFILE_LIST_KEY);
  if (nextLink) return nextLink;

  // 没有拿到链接则从数据库中查
  const { insertJsToNextProfile } = config;
  const { maxUpdatedAt, targetBiz } = insertJsToNextProfile;

  const searchQuery = {
    $or: [
      { openHistoryPageAt: { $lte: maxUpdatedAt } },
      { openHistoryPageAt: { $exists: false } }
    ]
  };

  if (targetBiz && targetBiz.length > 0) searchQuery.msgBiz = { $in: targetBiz };

  const links = await models.Profile.find(searchQuery).select('msgBiz').then(profiles => {
    if (!(profiles && profiles.length > 0)) return [];
    return profiles.map(profile => {
      const link = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${profile.msgBiz}&scene=124#wechat_redirect`;
      return link;
    });
  });

  // 如果还查不到 则证明已经抓取完毕了 返回undefined
  if (links.length === 0) return;

  // 将从数据库中查到的链接放入redis中
  await redis('rpush', PROFILE_LIST_KEY, links);

  // 再查一次就有下一个链接了
  return getNextProfileLink();
}

module.exports = {
  getReadAndLikeNum,
  getPostBasicInfo,
  handlePostHtml,
  getComments,
  getProfileBasicInfo,
  getPostList,
  handleProfileHtml
};
