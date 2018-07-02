'use strict';

const AnyProxy = require('anyproxy');
const exec = require('child_process').exec;
const ip = require('ip');
const { log } = console;
const config = require('./config');
const redis = require('./utils/redis');

const {
  redis: redisConfig,
  anyproxy: anyproxyConfig,
  serverPort,
} = config;

const { POST_LIST_KEY, PROFILE_LIST_KEY } = redisConfig;

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

const proxyServer = new AnyProxy.ProxyServer({
  ...anyproxyConfig,

  // 所有的抓取规则
  rule: require('./rule'),
});

proxyServer.on('ready', () => {
  const ipAddress = ip.address();
  log(`请配置代理: ${ipAddress}:8101`);
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

require('./server').listen(serverPort, () => {
  log('可视化界面: http://localhost:8104');
});
