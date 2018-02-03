const ENV = process.env.NODE_ENV || 'development';
const config = {};

if (ENV === 'development') {
  config.posts = '/api/posts';
  config.profiles = '/api/profiles';
  config.cates = '/api/categories';
} else {
  config.posts = '/api/posts';
  config.profiles = '/api/profiles';
  config.cates = '/api/categories';
}

export default config;
