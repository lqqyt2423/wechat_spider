const ENV = process.env.NODE_ENV || 'development';
const config = {};

if (ENV === 'development') {
  config.posts = '/wechat-data-api/posts';
  config.profiles = '/wechat-data-api/profiles';
  config.cates = '/wechat-data-api/categories';
} else {
  config.posts = '/wechat-data-api/posts';
  config.profiles = '/wechat-data-api/profiles';
  config.cates = '/wechat-data-api/categories';
}

export default config;