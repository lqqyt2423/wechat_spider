'use strict';

const url = require('url');
const querystring = require('querystring');
const config = require('../config').insertJsToNextProfile;
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const debug = require('debug')('wechat_spider:profile');
var links = [];

function insertJsToNextProfile(link, response, content) {
  let contentType = response.headers['content-type'];
  if (contentType.indexOf('html') === -1) return Promise.resolve(content);
  debug('剩余抓取公众号历史消息数量 => ', links.length);
  if (config.disable) return Promise.resolve(content);
  content = content.toString();
  let identifier = querystring.parse(url.parse(link).query);
  let msgBiz = identifier.__biz;
  return profileQueue().then(link => {
    if (!link) return content;
    let insertJs = `
<script type="text/javascript">
  window.onload = function() {
    (function scrollDown(){
      var xhr = new XMLHttpRequest;
      xhr.open("get", "/tonextprofile?biz=${msgBiz}", false);
      xhr.send(null);
      if (xhr.responseText == "true") {
        document.body.scrollIntoView();
        var meta = document.createElement("meta");
        meta.httpEquiv = "refresh";
        meta.content = "${config.jumpInterval};url=${link}";
        document.head.appendChild(meta);
      } else {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(scrollDown, ${config.jumpInterval} * 1000);
      }
    })();
  }
</script>`;
    content = content.replace('<!--headTrap<body></body><head></head><html></html>-->','').replace('<!--tailTrap<body></body><head></head><html></html>-->','');
    content = content.replace('</body>',insertJs + '\n</body>');
    return content;
  });
}

function profileQueue() {
  if (links.length) {
    let promise = Promise.resolve();
    return promise.then(() => {
      return links.shift();
    });
  } else {
    let query = {};
    let promise = Promise.resolve();
    query.$or = [
      { openHistoryPageAt: { $lte: config.maxUpdatedAt } },
      { openHistoryPageAt: { $exists: false } },
      { createdAt: { $gte: config.maxUpdatedAt } }
    ];
    let targetBiz = config.targetBiz;
    if (targetBiz && targetBiz.length) {
      query.msgBiz = { $in: targetBiz };
      promise = promise.then(() => {
        return Promise.all(targetBiz.map(biz => {
          return Profile.findOne({ msgBiz: biz }).then(profile => {
            if (!profile) {
              let profile = new Profile({
                msgBiz: biz
              });
              return profile.save();
            }
          });
        }));
      });
    }
    return promise.then(() => {
      return Profile.find(query, { msgBiz: 1 }).then(profiles => {
        if (profiles && profiles.length) {
          profiles.forEach(profile => {
            let link = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${profile.msgBiz}&scene=124#wechat_redirect`;
            links.push(link);
          });
          return links.shift();
        }
      });
    });
  }
}

function isJumpToNext(link) {
  let msgBiz = querystring.parse(url.parse(link).query).biz;
  return Post.count({
    updatedAt: { $gte: config.beginTime },
    publishAt: { $lte: config.minTime },
    msgBiz: msgBiz
  }).then(count => {
    if (count) {
      return 'true';
    } else {
      return 'false';
    }
  });
}

exports = module.exports = insertJsToNextProfile;
exports.isJumpToNext = isJumpToNext;
