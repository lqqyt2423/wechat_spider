'use strict';

const config = require('../config');

const { proxyBasicAuth } = config;
const { enable, user, password } = proxyBasicAuth;

const authRes = {
  response: {
    statusCode: 407,
    header: { 'Proxy-Authenticate': 'Basic realm="Access to internal site"' },
  },
};

// 如返回 undefined 则未开启基本认证或认证通过
// 若有对象返回则认证不通过
function basicAuth(headers) {
  if (!enable) return;
  if (!user || !password) return;

  let auth = headers['Proxy-Authorization'];
  if (!auth) return authRes;

  auth = auth.replace('Basic ', '');
  auth = new Buffer(auth, 'base64').toString();
  if (auth !== `${user}:${password}`) return authRes;
}

module.exports = basicAuth;
