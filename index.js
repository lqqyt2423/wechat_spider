'use strict';

const proxy = require('anyproxy');

// create cert when you want to use https features
// please manually trust this rootCA when it is the first time you run it
!proxy.isRootCAFileExists() && proxy.generateRootCA();

const options = {
  type: 'http',
  port: 8101,
  hostname: 'localhost',
  rule: require('./rule'),
  // optional, save request data to a specified file, will use in-memory db if not specified
  dbFile: null,
  // optional, port for web interface
  webPort: 8102,
  // optional, internal port for web socket, replace this when it is conflict with your own service
  socketPort: 8103,
  // optional, speed limit in kb/s
  throttle: 5000,
  // optional, set it when you don't want to use the web interface
  disableWebInterface: false,
  // set anyproxy as your system proxy
  setAsGlobalProxy: false,
  // optional, do not print anything into terminal. do not set it when you are still debugging.
  silent: false
};
new proxy.proxyServer(options);

require('./server').listen(8104);
