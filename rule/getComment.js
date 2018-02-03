'use strict';

const url = require('url');
const querystring = require('querystring');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

module.exports = async function(link, content) {
  content = JSON.parse(content.toString());
  let electedComment = content.elected_comment;
  if (electedComment && electedComment.length) {
    let identifier = querystring.parse(url.parse(link).query);
    let msgBiz = identifier.__biz;
    let msgMid = identifier.appmsgid;
    let msgIdx = identifier.idx;
    let postId = await findPost(msgBiz, msgMid, msgIdx);
    let comments = electedComment.map(comment => {
      let contentId = comment.content_id;
      let nickName = comment.nick_name;
      let logoUrl = comment.logo_url;
      let commentContent = comment.content;
      let createTime = new Date(comment.create_time * 1000);
      let likeNum = comment.like_num;
      let reply = comment.reply;
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
        contentId: contentId,
        postId: postId,
        nickName: nickName,
        logoUrl: logoUrl,
        content: commentContent,
        createTime: createTime,
        likeNum: likeNum,
        replies: replies
      };
    });
    await Promise.all(comments.map(comment => {
      return Comment.findOne({ contentId: comment.contentId }).then(c => {
        if (c) {
          return Comment.findByIdAndUpdate(c._id, comment);
        } else {
          let c = new Comment(comment);
          return c.save();
        }
      });
    }));
  }
};

async function findPost(biz, mid, idx) {
  let post = await Post.findOne({
    msgBiz: biz,
    msgMid: mid,
    msgIdx: idx
  });
  if (post) {
    return post._id;
  } else {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    return await findPost(biz, mid, idx);
  }
}
