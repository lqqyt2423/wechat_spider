'use strict';

const Post = require('../models/Post');
const url = require('url');
const querystring = require('querystring');

let count = 0;
const sendPostsData = require('../api/io').sendPostsData;
function ioSend() {
	if (++count >= 5) {
		sendPostsData();
		count = 0;
	}
}

function getMainData(link, content) {
	let promise = Promise.resolve();
	let identifier = querystring.parse(url.parse(link).query);
	const [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];
	content = JSON.parse(content.toString());
	const [ readNum, likeNum ] = [ content.appmsgstat.read_num, content.appmsgstat.like_num ];
	return promise.then(() => {
		return Post.findOne({
			msgBiz: msgBiz,
			msgMid: msgMid,
			msgIdx: msgIdx
		}).then(post => {
			if (post) {
				return Post.findByIdAndUpdate(post._id, {
					readNum: readNum,
					likeNum: likeNum,
					updateNumAt: new Date()
				});
			} else {
				let post = new Post({
					msgBiz: msgBiz,
					msgMid: msgMid,
					msgIdx: msgIdx,
					readNum: readNum,
					likeNum: likeNum,
					updateNumAt: new Date()
				});
				return post.save();
			}
		}).then(() => {
			ioSend();
		}).catch(e => {
			console.log(e);
		});
	})
}

module.exports = getMainData;