'use strict';

const AnyProxy = require('anyproxy');
const exec = require('child_process').exec;
const ip = require('ip');
const { log } = console;
const config = require('./config');
const redis = require('./utils/redis');

const { POST_LIST_KEY, PROFILE_LIST_KEY } = config.redis;

// 引导安装HTTPS证书
if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
  AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
    if (!error) {
      const certDir = require('path').dirname(keyPath);
      log('The cert is generated at', certDir);
      const isWin = /^win/.test(process.platform);
      if (isWin) {
        exec('start .', { cwd: certDir });
      } else {
        exec('open .', { cwd: certDir });
      }
    } else {
      console.error('error when generating rootCA', error);
    }
  });
}

const options = {
  port: 8101,
  rule: require('./rule'),
  webInterface: {
    enable: false,
    webPort: 8102
  },

  // 默认不限速
  // throttle: 10000,

  // 强制解析所有HTTPS流量
  forceProxyHttps: true,

  // 不开启websocket代理
  wsIntercept: false,

  silent: true
};

const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => {
  const ipAddress = ip.address();
  log(`请配置代理: ${ipAddress}:8101`);
  log('可视化界面: http://localhost:8104\n');
});
proxyServer.on('error', (e) => {
  throw e;
});

// 删除redis中对应缓存后再启动
redis('del', POST_LIST_KEY, PROFILE_LIST_KEY).then(() => {
  proxyServer.start();
});

// when finished
// proxyServer.close();

require('./server').listen(8104);
