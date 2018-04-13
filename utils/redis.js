'use strict';

const redis = require('redis');
const { promisify } = require('util');
const config = require('../config');

const { port = 6379, host = '118.24.68.134' } = config.redis;

const redisClient = redis.createClient(port, host,result=>{
    console.log(result.toString());
});

module.exports = asyncRedis;

function asyncRedis(cmd, ...args) {
  return promisify(redisClient[cmd]).call(redisClient, ...args);
}
