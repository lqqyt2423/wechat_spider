'use strict';

const AnyProxy = require('anyproxy');
const exec = require('child_process').exec;
const ip = require('ip');
const config = require('./config');
const utils = require('./utils');
const logger = require('./utils/logger');

const {
  anyproxy: anyproxyConfig,
  serverPort,
} = config;

// 引导安装 HTTPS 证书
if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
  AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
    if (!error) {
      const certDir = require('path').dirname(keyPath);
      logger.info('The cert is generated at %s', certDir);
      const isWin = /^win/.test(process.platform);
      if (isWin) {
        exec('start .', { cwd: certDir });
      } else {
        exec('open .', { cwd: certDir });
      }
    } else {
      logger.error(error);
    }
  });
}

const ipAddress = ip.address();
const proxyServer = new AnyProxy.ProxyServer({
  ...anyproxyConfig,

  // 所有的抓取规则
  rule: require('./rule'),
});

proxyServer.on('ready', () => {
  logger.info('请配置HTTP代理: %s:8101', ipAddress);
});

proxyServer.on('error', (e) => {
  logger.error(e);
});

// 删除 redis 中对应缓存后再启动
utils.delCrawlLinkCache().then(() => {
  proxyServer.start();
}, e => {
  logger.error(e);
});

// when finished
// proxyServer.close();

require('./server').listen(serverPort, () => {
  logger.info('数据管理页面: http://%s:8104', ipAddress);
});
