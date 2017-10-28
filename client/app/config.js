const ENV = process.env.NODE_ENV || 'development';
const config = {};

if (ENV === 'development') {
  config.posts = '/api/posts';
  config.profiles = '/api/profiles';
} else {
  config.posts = '';
  config.post = '';
}

export default config;