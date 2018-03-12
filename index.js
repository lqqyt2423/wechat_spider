'use strict';

const AnyProxy = require('anyproxy');
const exec = require('child_process').exec;

// 引导安装HTTPS证书
if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
  AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
    if (!error) {
      const certDir = require('path').dirname(keyPath);
      console.log('The cert is generated at', certDir);
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
    enable: true,
    webPort: 8102
  },

  // 默认不限速
  // throttle: 10000,

  // 强制解析所有HTTPS流量
  forceProxyHttps: false,

  // 不开启websocket代理
  wsIntercept: false,

  silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => {
  console.log('ready');
});
proxyServer.on('error', (e) => {
  console.error(e);
});

proxyServer.start();

// when finished
// proxyServer.close();

// require('./server').listen(8104);
