'use strict';

const redis = require('redis');
const { promisify } = require('util');
const config = require('../config');

const { port = 6379, host = '127.0.0.1' } = config.redis;

const redisClient = redis.createClient(port, host);

module.exports = asyncRedis;

function asyncRedis(cmd, ...args) {
  return promisify(redisClient[cmd]).call(redisClient, ...args);
}
