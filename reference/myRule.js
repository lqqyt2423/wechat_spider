var mysql = require('mysql');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');


// 创建数据库连接，需根据自己数据库账号密码修改
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '0000',
	database: 'phone_weixin'
});

connection.connect();

// 全局公众号对象，通过判断只在第一次插入数据库中
var mpAccount = {};
// 全局对象，判断某一公众号指定天数内的文章
var isScrollDown = {}
var msgLinks = [];
var profiles = [];

// var targetBiz = 'MjM5MzcxMjQzOQ==';


// 文章页抓取时间规则
var biggerTime = new Date(2017, 4, 15).getTime();
var interTime = 0.25 * 24 * 60 * 60 * 1000;
var lessTime = Date.now() - interTime;
lessTime = new Date(2017, 6, 4).getTime();

// 历史页抓取时间规则
var afterTime = new Date(2017, 5, 25).getTime();

// 文章跳转时间
var basicTimeSeconds = 3;
var randomTimeSeconds = 3;

// 历史页跳转时间
var basicTimeSecondsPro = 10;
var randomTimeSecondsPro = 10;

getAllLinks(function(){
	console.log('数据库中现在需要抓取的文章数量：' + msgLinks.length);
});

getAllProfiles(function(){
	console.log('数据库中现在需要抓取的历史公众号数量：' + profiles.length);
});


// 程序一开始从数据库中取出所有待抓取的文章保存在数组中
function getAllLinks(cb){
	connection.query('select distinct msg_link from msg where (read_num is null or modi_time - publish_time < ?) and publish_time > ? and publish_time < ? and is_fail is null', [interTime, biggerTime, lessTime], function(err, results){
		if (err) throw err;
		results.forEach(function(item){
			msgLinks.push(item.msg_link);
		});
		cb();
	});
}


// 程序一开始从数据库中取出所有待抓取的公众号保存在数组中
function getAllProfiles(cb){
	connection.query('select biz from history where moditime is null or moditime < ? order by moditime', [Date.now() - 3 * 24 * 60 * 60 * 1000], function(err, results){
		if (err) throw err;
		results.forEach(function(item){
			profiles.push(item.biz);
		});
		cb();
	});
}


// 获取阅读量、点赞量、安卓手机赞赏量
function getReadAndLikeNum(req, res, serverResData, callback){

	try {
		var now = Date.now();
		var link = req.url;
		var linkParse = querystring.parse(url.parse(link).query);
		var msgBiz = linkParse.__biz;
		var msgMid = linkParse.mid;
		var msgIdx = linkParse.idx;
		var content = serverResData.toString();
		var contentJs = JSON.parse(content);
		// 阅读量
		var readNum = contentJs.appmsgstat.read_num;
		// 点赞量
		var likeNum = contentJs.appmsgstat.like_num;
		// 赞赏量，若没有，赋值0
		var rewardTotalCount = contentJs.reward_total_count ? contentJs.reward_total_count : 0;

		// 判断数据库中是否有此文章，若存在，更新阅读量点赞量等数据；若不存在，不做任何操作
		connection.query('select id, msg_title, publish_time from msg where msg_biz = ? and msg_mid = ? and msg_idx = ?', [msgBiz, msgMid, msgIdx], function(error, results, fields){
			if (error) throw error;
			if (results.length == 0) {
				console.log('阅读量：' + readNum + '\t点赞量：' + likeNum);
			} else {
				var id = results[0].id;
				var msgTitle = results[0].msg_title;
				var publishTime = new Date(parseInt(results[0].publish_time));
				publishTime = publishTime.getFullYear() + '-' + (publishTime.getMonth()+1) + '-' + publishTime.getDate();
				// 更新msg表中阅读量、点赞量、赞赏量、抓取时间等字段
				connection.query('update msg set read_num = ?, like_num = ?, reward_total_count = ?, modi_time = ? where id = ?', [readNum, likeNum, rewardTotalCount, now, id], function(error, results, fields){
					if (error) throw error;
					console.log('标题：' + msgTitle + '\n日期：' + publishTime + '\tid：' + id + '\t阅读量：' + readNum + '\t点赞量：' + likeNum + '\n');
				});
			}
		});

	} catch(e) {
		// 极少数特殊情况
		console.log('无法获取阅读量和点赞量\n')
		// throw (e);
	}
	callback(serverResData);
}


// 从历史详情页获得文章链接等数据
function getProfile(req,res,serverResData,callback){
	var link = req.url,
		content = serverResData.toString()
		contentType = res.headers["content-type"];
	// 判断content-type确定是json还是html
	if (/json/.test(contentType)) {
		var contentJs = JSON.parse(content);
		var generalMsgList = JSON.parse(contentJs.general_msg_list);
		var list = generalMsgList.list;		
		for (var i=0,len=list.length; i<len; i++){
			try{
				// 单图文
				var appMsg = list[i].app_msg_ext_info;
				var dateTime = (list[i].comm_msg_info.datetime*1000).toString();
				parseArticles(appMsg, dateTime);
				// 多图文
				if (appMsg.multi_app_msg_item_list) {
					var multiAppMsg = appMsg.multi_app_msg_item_list;
					if (multiAppMsg.length != 0){
						for (var j=0,lLen=multiAppMsg.length; j<lLen; j++){
							parseArticles(multiAppMsg[j], dateTime);
						}
					}
				}
			} catch(e) {
				// 如果历史消息是图片或文字则打印此消息
				if (e instanceof TypeError) {
					console.log('错误：TypeError');
				} else {
					console.log(e);
				}
				continue;
			}
		}
		callback(serverResData);
	} else if (/html/.test(contentType)){
		// 正则匹配到JSON
		var contentJSON = /var msgList = '(.+)';\n/.exec(content)[1];
		// 转义为正常字符
		var contentJSON = escape2Html(contentJSON).replace(/\\\//g,"/");
		var contentJs = JSON.parse(contentJSON);
		// 文章列表
		var list = contentJs.list;
		for (var i=0,len=list.length; i<len; i++){
			try{
				// 单图文
				var appMsg = list[i].app_msg_ext_info;
				var dateTime = (list[i].comm_msg_info.datetime*1000).toString();
				parseArticles(appMsg, dateTime);
				// 多图文
				if (appMsg.multi_app_msg_item_list) {
					var multiAppMsg = appMsg.multi_app_msg_item_list;
					if (multiAppMsg.length != 0){
						for (var j=0,lLen=multiAppMsg.length; j<lLen; j++){
							parseArticles(multiAppMsg[j], dateTime);
						}
					}
				}
			} catch(e) {
				if (e instanceof TypeError) {
					// 如果历史消息是图片或文字则打印此消息
					console.log('错误：TypeError');
				} else {
					console.log(e);
				}
				continue;
			}
		}
		// 往历史记录数据表中插入何时抓取的此历史页面
		var link = req.url;
		var linkParse = querystring.parse(url.parse(link).query);
		var msgBiz = linkParse.__biz;
		connection.query('select id from history where biz = ?', [msgBiz], function(error, results, fields){
			if (error) throw error;
			if (results.length == 0) {
				var historyData = {
					biz: msgBiz,
					url: link,
					moditime: Date.now()
				};
				connection.query('insert into history set ?', historyData, function(error, results, fields){
					if (error) throw error;
				});
			} else {
				connection.query('update history set url = ?, moditime = ? where biz = ?', [link, Date.now(), msgBiz], function(error, results, fields){
					if (error) throw error;
				});
			}
		});
		// 不用关注此公众号也可实现自动跳转，只不过只能获取最近10天的文章
		if (content.indexOf('关注公众帐号，接收更多消息') > -1) {
			isScrollDown[msgBiz] = true;
		}

		if (profiles.length > 0) {
			var nextProfile = profiles.shift();
			var nextProLink = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=' + nextProfile + '&scene=124#wechat_redirect';
			console.log('\n下一条即将跳至公众号：' + nextProfile);
			console.log('剩余公众号数量：' + profiles.length + '\n');
			let delayTime = Math.floor(Math.random()*randomTimeSecondsPro+basicTimeSecondsPro);
			// 只抓取30天内的历史文章消息后，隔10s跳转至下一条公众号
			var scrollDownJs = '<script type="text/javascript">var end = document.createElement("p");document.body.appendChild(end);(function scrollDown(){var xhr = new XMLHttpRequest;xhr.open("get", "/startAnother?biz=' + msgBiz + '", false);xhr.send(null);if (xhr.responseText == "true") {document.body.scrollIntoView();var meta = document.createElement("meta");meta.httpEquiv = "refresh";meta.content = "' + delayTime + ';url=' + nextProLink + '";document.head.appendChild(meta);} else {end.scrollIntoView();setTimeout(scrollDown,Math.floor(Math.random()*10000+5000));}})();</script>';
			// 将此公众号下拉至最早的一篇历史消息文章后，再隔10s跳转至下一公众号（与上面一行代码两者取其一执行）
			// var scrollDownJs = '<script type="text/javascript">var end = document.createElement("p");document.body.appendChild(end);(function scrollDown(){end.scrollIntoView();var loadMore = document.getElementsByClassName("loadmore with_line")[0];if (!loadMore.style.display) {document.body.scrollIntoView();var meta = document.createElement("meta");meta.httpEquiv = "refresh";meta.content = "10;url=' + nextProLink + '";document.head.appendChild(meta);} else {setTimeout(scrollDown,Math.floor(Math.random()*2000+1000));}})();</script>';
			content = content.replace("<!--headTrap<body></body><head></head><html></html>-->","").replace("<!--tailTrap<body></body><head></head><html></html>-->","");
			content = content.replace("</body>",scrollDownJs + "\n</body>");
			serverResData = content;
			callback(serverResData);
		} else {
			// 只抓取30天内的历史文章消息
			var scrollDownJs = '<script type="text/javascript">var end = document.createElement("p");document.body.appendChild(end);(function scrollDown(){var xhr = new XMLHttpRequest;xhr.open("get", "/startAnother?biz=' + msgBiz + '", false);xhr.send(null);if (xhr.responseText == "true") {document.body.scrollIntoView();} else {end.scrollIntoView();setTimeout(scrollDown,Math.floor(Math.random()*2000+1000));}})();</script>';			
			// 抓取所有的历史文章消息（与上面一行代码两者取其一执行）
			// var scrollDownJs = '<script type="text/javascript">var end = document.createElement("p");document.body.appendChild(end);(function scrollDown(){end.scrollIntoView();setTimeout(scrollDown,Math.floor(Math.random()*5000+5000));})();</script>'
			content = content.replace("<!--headTrap<body></body><head></head><html></html>-->","").replace("<!--tailTrap<body></body><head></head><html></html>-->","");
			content = content.replace("</body>",scrollDownJs + "\n</body>");
			serverResData = content;
			callback(serverResData);
		}
	}
	// connection.end();
}


// 解析数据，之后调用保存在数据库中的函数
function parseArticles(o, dateTime){
	var contentUrl = o.content_url;
	var contentTitle = o.title;
	var cover = o.cover;
	var digest = o.digest;
	var sourceUrl = o.source_url;
	var copyrightStat = o.copyright_stat;
	var author = o.author;
	if (contentTitle && contentUrl){
		var otherArgus = querystring.parse(url.parse(contentUrl.replace(/amp;/g, '')).query);
		var msgBiz = otherArgus.__biz;
		var msgMid = otherArgus.mid;
		var msgIdx = otherArgus.idx;
		var insertData = {
			msg_title: contentTitle,
			msg_link: contentUrl,
			publish_time: dateTime,
			msg_cover: cover,
			msg_digest: digest,
			msg_source_url: sourceUrl,
			msg_biz: msgBiz,
			msg_mid: msgMid,
			msg_idx: msgIdx,
			copyright_stat: copyrightStat,
			author: author
		};
		whetherInsertData(insertData);
	}
}


// 插入数据库时判断此数据是否已经存在
function whetherInsertData(iD){
	// 历史页抓取时间规则
	if (iD.publish_time < afterTime) {
		isScrollDown[iD.msg_biz] = true;
	}
	// 格式化时间，终端显示作用
	var formarDate = new Date(parseInt(iD.publish_time));
	formarDate = formarDate.getFullYear() + '-' + (formarDate.getMonth()+1) + '-' + formarDate.getDate();
	// 替换掉emoji表情，否则插入数据库会出错
	iD.msg_title = iD.msg_title.replace(/[\ud000-\udfff]/g, '');
	iD.msg_digest = iD.msg_digest.replace(/[\ud000-\udfff]/g, '');
	iD.author = iD.author.replace(/[\ud000-\udfff]/g, '');
	connection.query('select id from msg where msg_biz = ? and msg_mid = ? and msg_idx = ?', [iD.msg_biz, iD.msg_mid, iD.msg_idx], function(error, results, fields){
		if (error) throw error;
		if (results.length == 0) {
			connection.query('insert into msg set ?', iD, function(error, results, fields){
				if (error) throw error;
				console.log('日期：' + formarDate + '\t标题：' + iD.msg_title + '\n');
				if (iD.publish_time < lessTime && iD.publish_time > biggerTime) {
					msgLinks.push(iD.msg_link);
					console.log('剩余文章数量：' + msgLinks.length + '\n');
				}
			});
		} else {
			console.log('日期：' + formarDate + '\t已经存在此文章\tid：' + results[0].id + '\n标题：' + iD.msg_title + '\n');
		}
	});
}


// 文章页，注入js脚本使自动翻页
function insertJsForRefresh(req, res, serverResData, callback){
	var link = req.url;
	var linkParse = querystring.parse(url.parse(link).query);
	var msgBiz = linkParse.__biz;
	var msgMid = linkParse.mid;
	var msgIdx = linkParse.idx;

	if (msgLinks.length > 0) {
		// 如果此文章被删除就在数据库中设置is_fail字段为1，之后就不再抓取此文章
		var bodyContent = serverResData.toString();
		if (bodyContent.indexOf('global_error_msg') > -1 || bodyContent.indexOf('icon_msg warn') > -1) {
			connection.query('update msg set is_fail = 1 where msg_biz = ? and msg_mid = ? and msg_idx = ?', [msgBiz, msgMid, msgIdx], function(error, results, fields){
				if (error) throw error;
				console.log('此内容无法查看，已经更改数据库对应参数，下次不再抓取\n');
			});
		}

		// array返回的下一篇文章链接
		var nextLink = msgLinks.shift();
		console.log('剩余文章数量：' + msgLinks.length);
		// 延迟跳转时间，2秒，3秒或4秒随机延迟，建议间隔时间设置大一些
		var delayTime = Math.floor(Math.random()*randomTimeSeconds+basicTimeSeconds);
		// 实质是注入头部meta标签，跳转至下一个网页
		var insertJs = '<meta http-equiv="refresh" content="' + delayTime + ';url=' + nextLink + '" />';
		// 此刻改变了serverResData的内容，返回至微信客户端中
		serverResData = serverResData.toString().replace('</title>', '</title>' + insertJs);			
		callback(serverResData);


		// 判断是否公众号表中有对应信息，只判断一次
		if (mpAccount[msgBiz] == undefined) {
			// 公众号名称、公众号ID、公众号性质
			var bodyContent = serverResData.toString();
			try {
				// 公众号名称
				var nickName = /<strong class="profile_nickname">(.+?)<\/strong>/.exec(bodyContent)[1];
				var metaValuePattern = /<span class="profile_meta_value">(.+?)<\/span>/g;
				var metaValue;
				var metaValues = [];
				while ((metaValue=metaValuePattern.exec(bodyContent)) != null) {
					metaValues.push(metaValue[1]);
				}
				if (metaValues.length == 1) {
					var metaValueId = '';
					var metaValueDesc = metaValues[0];
				} else if (metaValues.length == 2) {
					var metaValueId = metaValues[0];
					var metaValueDesc = metaValues[1];
				}

				// 判断history表中是否存在，如不存在插入此条公众号信息
				connection.query('select id from history where biz = ?', [msgBiz], function(error, results, fields){
					if (error) throw error;
					if (results.length == 0) {
						var insertMpData = {
							biz: msgBiz,
							nickname: nickName,
							nickid: metaValueId,
							nickdesc: metaValueDesc
						};
						connection.query('insert into history set ?', insertMpData, function(error, results, fields){
							if (error) throw error;
						});
					} else {
						connection.query('update history set nickname = ?, nickid = ?, nickdesc = ? where biz = ?', [nickName, metaValueId, metaValueDesc, msgBiz], function(err, results, fields){
							if (err) throw err;
						});
					}
					mpAccount[msgBiz] = true;
				});
			} catch(e) {
				// 通常不会流入此流程
				if (bodyContent.indexOf('该内容已被发布者删除') > -1 || bodyContent.indexOf('此内容因违规无法查看') > -1 || bodyContent.indexOf('此帐号处于帐号迁移流程中') > -1) {
					connection.query('update msg set is_fail = 1 where msg_biz = ? and msg_mid = ? and msg_idx = ?', [msgBiz, msgMid, msgIdx], function(error, results, fields){
						if (error) throw error;
						console.log('此内容无法查看，已经更改数据库对应参数，下次不再抓取\n');
					});
				} else {
					console.log(e);
				}
			}
		}
	} else {
		console.log('所有文章已抓取完成');
		callback(serverResData);
	}
}


// 转义符换成普通字符
function escape2Html(str){
	var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
	return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}


exports.insertJsForRefresh = insertJsForRefresh;
exports.getProfile = getProfile;
exports.isScrollDown = isScrollDown;
exports.getReadAndLikeNum = getReadAndLikeNum;