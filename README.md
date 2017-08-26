# wechat_spider 微信爬虫

通过中间人代理的原理，批量获取微信文章数据，包括阅读量和点赞量等数据。使用代理模块 anyproxy。

安装和使用：

```
git clone https://github.com/lqqyt2423/wechat_spider.git
cd wechat_spider
npm install
npm start
```

注意：https 请求需安装证书，电脑和手机都需要安装。参考地址：[anyproxy https相关教程](https://github.com/alibaba/anyproxy/wiki/HTTPS%E7%9B%B8%E5%85%B3%E6%95%99%E7%A8%8B)。

程序运行后，手机连接终端提示的代理地址，打开微信抓取文章数据。
