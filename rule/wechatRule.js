'use strict';

const url = require('url');
const moment = require('moment');
const models = require('../models');
const config = require('../config');
const cheerio = require('cheerio');
const redis = require('../utils/redis');
const debug = require('../utils/debug')('wechatRule');

const {
  rule: ruleConfig,
  redis: redisConfig,
} = config;

// 链接数组的缓存 每次重启程序后都会清空
const { POST_LIST_KEY, PROFILE_LIST_KEY } = redisConfig;

const {
  isReplacePostBody,
  isCrawlComments,
  page: pageConfig,
  profile: profileConfig,
} = ruleConfig;

const getReadAndLikeNum = async function (ctx) {
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
      debug('文章标题:', title);
    } else {
      debug('文章id:', id);
    }
    debug('阅读量:', readNum, '点赞量:', likeNum);
    debug();

    await redis('llen', POST_LIST_KEY).then(len => {
      debug('剩余文章抓取长度:', len);
      debug();
    });

  } catch (e) {
    throw e;
  }
};

const getPostBasicInfo = async function (ctx) {
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
  if (pageConfig.isSavePostContent) {
    const $ = cheerio.load(body, { decodeEntities: false });
    let content;
    if (pageConfig.saveContentType === 'html') {
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

const handlePostHtml = async function (ctx) {
  if (!isPostPage(ctx)) return;

  const { res } = ctx;
  let body = res.response.body.toString();

  // 替换显示在手机上的正文 加速网络
  if (isReplacePostBody) {
    const len = await redis('llen', POST_LIST_KEY);
    body.replace(/<div class="rich_media_content " id="js_content">((\s|\S)+?)<\/div>\s+?<script nonce=/, (_, content) => {
      if (content) body = body.replace(content, `剩余文章抓取长度: ${len}`);
    });
  }

  // 加入meta head控制自动翻页
  if (!pageConfig.disable) {
    const nextLink = await getNextPostLink();
    if (!nextLink) {
      debug('所有文章已经抓取完毕');
      debug();
    } else {
      const insertJsStr = '<meta http-equiv="refresh" content="' + pageConfig.jumpInterval + ';url=' + nextLink + '" />';
      body = body.replace('</title>', '</title>' + insertJsStr);
    }

  }

  return {
    response: { ...res.response, body }
  };
};

const getComments = async function (ctx) {
  if (!isCrawlComments) return;

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

    debug(`已抓取${postComments.length}条评论`);
    debug();

  } catch (e) {
    throw e;
  }
};

const getProfileBasicInfo = async function (ctx) {
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
    const data = JSON.parse(escape2Html(content).replace(/\\\//g, '/'));
    const postList = data.list;
    await savePostsData(postList);
  } catch (e) {
    throw e;
  }
};

const getPostList = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/profile_ext\?action=getmsg&__biz=/.test(link)) return;

  const body = res.response.body.toString();

  try {
    const data = JSON.parse(body);
    const postList = JSON.parse(data.general_msg_list).list;
    await savePostsData(postList);
  } catch (e) {
    throw e;
  }
};

const handleProfileHtml = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  if (!/\/mp\/profile_ext\?action=home&__biz=/.test(link)) return;

  let { minTime, jumpInterval } = profileConfig;

  const urlObj = url.parse(link, true);
  const msgBiz = urlObj.query.__biz;

  const scrollInterval = jumpInterval * 1000;

  // 最小时间再减一天 保证抓到的文章一定齐全
  await models.Profile.logInfo(msgBiz);
  minTime = new Date(minTime).getTime() - 1000 * 60 * 60 * 24;
  let debugArr = ['minTime before', new Date(minTime)];
  minTime = await models.ProfilePubRecord.getMinTargetTime(msgBiz, minTime);
  debugArr = debugArr.concat(['minTime after', minTime]);
  debug(...debugArr);
  minTime = minTime.getTime();

  let body = res.response.body.toString();

  // 根据抓取时间和公众号的抓取结果 判断是否下拉和页面跳转
  const insertJsStr = `<script type="text/javascript">
  (function() {
    window.addEventListener('load', () => {

      // 跳转至下一个页面的方法
      const jumpFn = link => {
        const refreshMeta = document.createElement('meta');
        refreshMeta.httpEquiv = 'refresh';
        refreshMeta.content = '0;url=' + link;
        document.head.appendChild(refreshMeta);
      };

      // 控制跳转
      const controlJump = () => {
        setTimeout(() => {
          fetch('/wx/profiles/next_link')
            .then(res => res.json())
            .then(res => {
              const nextLink = res.data;
              // 跳转
              if (nextLink) return jumpFn(nextLink);
              // 重来
              controlJump();
            })
        }, ${scrollInterval});
      };

      // 判断是否下拉页面的方法
      // 0 - 继续下拉
      // 1 - 已经符合截止日期
      // 2 - 已经抓至公众号第一篇文章
      // 3 - 未关注公众号
      const isScrollFn = time => {
        let contentText = document.querySelector('.weui-panel').innerText;
        contentText = contentText.trim();
        // 去除中间的空行
        const contentArr = contentText.split('\\n').filter(i => i);

        // 最后一行表示目前抓取的状态
        // 正在加载
        // 已无更多
        // 关注公众帐号，接收更多消息
        const statusStr = contentArr.pop();
        if (statusStr.indexOf('关注公众帐号，接收更多消息') > -1) {
          return { status: 3 };
        }

        // 倒数第二行表示最旧的一篇文章的发布日期
        let dateStr = contentArr.pop();
        dateStr = dateStr.trim();
        const dateRegexp = /(\\d{4})年(\\d{1,2})月(\\d{1,2})日/;
        if (dateRegexp.test(dateStr)) {
          dateStr = dateStr.match(dateRegexp)[0];
        }
        dateStr = dateStr.replace(dateRegexp, '$1/$2/$3');

        // alert('dateStr');
        // alert(dateStr);

        const minDate = new Date(dateStr).getTime();

        if (statusStr.indexOf('已无更多') > -1) {
          return { status: 2, publishAt: minDate };
        }

        if (minDate < time) return { status: 1 };
        return { status: 0 };
      };

      // 控制下拉页面的方法
      const controlScroll = () => {
        const res = isScrollFn(${minTime});

        // alert('res.status');
        // alert(res.status);

        const status = res.status;
        if (status === 0) {
          window.scrollTo(0, document.body.scrollHeight);
          setTimeout(controlScroll, ${scrollInterval});
          return;
        }

        // 告诉后端此公众号已经抓至第一篇文章了
        if (status === 2) {
          fetch('/ws/profiles/first_post', {
            method: 'POST',
            body: JSON.stringify({
              link: document.URL,
              publishAt: res.publishAt,
            }),
            headers: new Headers({
              'Content-Type': 'application/json',
            })
          }).then(() => {});
        }

        // 返回页头然后跳转
        window.scrollTo(0, 0);
        controlJump();
      };

      controlScroll();
    });
  })();
</script>`;
  body = body.replace('<!--headTrap<body></body><head></head><html></html>-->', '').replace('<!--tailTrap<body></body><head></head><html></html>-->', '');
  body = body.replace('</body>', insertJsStr + '\n</body>');
  return {
    response: { ...res.response, body }
  };
};

// 存文章基本信息至数据库
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

  let savedPosts = await Promise.all(posts.map(post => {
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

    const [cover, digest, sourceUrl] = [appMsg.cover, appMsg.digest, appMsg.source_url];

    return models.Post.findOneAndUpdate(
      { msgBiz, msgMid, msgIdx },
      { title, link, publishAt, cover, digest, sourceUrl },
      { new: true, upsert: true }
    );
  }));

  savedPosts = savedPosts.filter(p => p);

  if (savedPosts.length) {
    await models.Profile.logInfo(savedPosts[0].msgBiz);
  }

  savedPosts.forEach(post => {
    debug('发布时间:', post.publishAt ? moment(post.publishAt).format('YYYY-MM-DD HH:mm') : '');
    debug('文章标题:', post.title);
  });
  debug();

  // 记录公众号的发布记录
  await models.ProfilePubRecord.savePubRecords(savedPosts);

  await redis('llen', PROFILE_LIST_KEY).then(len => {
    debug('剩余公众号抓取长度:', len);
    debug();
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
  const { minTime, maxTime, isCrawlExist, targetBiz, crawlExistInterval } = pageConfig;

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

module.exports = {
  getReadAndLikeNum,
  getPostBasicInfo,
  handlePostHtml,
  getComments,
  getProfileBasicInfo,
  getPostList,
  handleProfileHtml,
};
