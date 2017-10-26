const ENV = process.env.NODE_ENV || 'development';
const config = {};

if (ENV === 'development') {
  config.posts = '/posts';
  config.profiles = '/profiles';
} else {
  config.posts = '';
  config.post = '';
}

export default config;