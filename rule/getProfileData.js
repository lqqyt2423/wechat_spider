'use strict';

const Profile = require('../models/Profile');
const Post = require('../models/Post');
const url = require('url');
const querystring = require('querystring');

function getProfileData(link, response, content) {
  let serverResData = content.toString();
  content = content.toString();
  let contentType = response.headers['content-type'];
  let postList;
  let promise = Promise.resolve();
  // content-type is json or html
  if (contentType.indexOf('json') > -1) {
    content = JSON.parse(content);
    const generalMsgList = JSON.parse(content.general_msg_list);
    postList = generalMsgList.list;
  } else if (contentType.indexOf('html') > -1) {
    promise = promise.then(() => {
      let identifier = querystring.parse(url.parse(link).query);
      let msgBiz = identifier.__biz;
      let title = /var nickname = "(.+?)"/.exec(serverResData)[1];
      let headimg = /var headimg = "(.+?)"/.exec(serverResData)[1];
      return Profile.findOne({ msgBiz: msgBiz }).then(profile => {
        if (profile) {
          return Profile.findByIdAndUpdate(profile._id, {
            msgBiz: msgBiz,
            title: title,
            headimg: headimg
          });
        } else {
          let profile = new Profile({
            msgBiz: msgBiz,
            title: title,
            headimg: headimg
          });
          return profile.save();
        }
      })
    })
    content = /var msgList = '(.+)';\n/.exec(content)[1];
    content = JSON.parse(escape2Html(content).replace(/\\\//g,"/"));
    postList = content.list;
  } else {
    return Promise.resolve();
  }
  let parsePosts = [];
  for (let i=0, len=postList.length; i<len; i++) {
    let post = postList[i];
    let appMsg = post.app_msg_ext_info;
    let publishAt = new Date(post.comm_msg_info.datetime*1000);
    parsePosts.push({
      appMsg: appMsg,
      publishAt: publishAt
    });
    let multiAppMsg = appMsg.multi_app_msg_item_list;
    if (multiAppMsg && multiAppMsg.length) {
      multiAppMsg.forEach(appMsg => {
        parsePosts.push({
          appMsg: appMsg,
          publishAt: publishAt
        });
      });
    }
  }
  return promise.then(() => {
    return Promise.all(parsePosts.map(postObj => {
      let promise = Promise.resolve();
      let appMsg = postObj.appMsg;
      let publishAt = postObj.publishAt;
      return promise.then(() => {
        let title = appMsg.title;
        let link = appMsg.content_url;
        if (title && link) {
          let [ cover, digest, sourceUrl ] = [ appMsg.cover, appMsg.digest, appMsg.source_url ];
          let identifier = querystring.parse(url.parse(link.replace(/amp;/g, '')).query);
          let [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];
          return Post.findOne({
            msgBiz: msgBiz,
            msgMid: msgMid,
            msgIdx: msgIdx
          }).then(post => {
            if (post) {
              return Post.findByIdAndUpdate(post._id, {
                title: title,
                link: link,
                publishAt: publishAt,
                cover: cover,
                digest: digest,
                sourceUrl, sourceUrl
              });
            } else {
              let post = new Post({
                msgBiz: msgBiz,
                msgMid: msgMid,
                msgIdx: msgIdx,
                title: title,
                link: link,
                publishAt: publishAt,
                cover: cover,
                digest: digest,
                sourceUrl, sourceUrl
              });
              return post.save();
            }
          });
        }
      }).catch(e => {
        console.log(e)
      });
    }));
  })
}

// 转义符换成普通字符
function escape2Html(str){
  const arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
  return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}

module.exports = getProfileData;