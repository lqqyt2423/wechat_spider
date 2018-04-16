import config from './config';

export function assembleUrl(path, params, method) {
  path = path || '';
  params = params || {};
  method = method ? method.toLowerCase() : 'get';
  Object.keys(params).forEach(function(key) {
    let _path = path.replace(`:${key}`, params[key]);
    if (_path === path) {
      if (method === 'get') {
        if (_path.indexOf('?') === -1) {
          _path = `${_path}?${key}=${params[key]}`;
        } else {
          _path = `${_path}&${key}=${params[key]}`;
        }
        delete params[key];
      }
    } else {
      delete params[key];
    }
    path = _path;
  });
  return path;
}

export const REQUEST_POSTS = 'REQUEST_POSTS';

export function requestPosts() {
  return {
    type: REQUEST_POSTS
  };
}

export const RECEIVE_POSTS = 'RECEIVE_POSTS';

export function receivePosts(posts) {
  return {
    type: RECEIVE_POSTS,
    posts
  };
}

export function fetchPosts(query) {
  let path = assembleUrl(config.posts, query);
  return function(dispatch) {
    dispatch(requestPosts());
    return fetch(path).then(res => res.json()).then(posts => {
      dispatch(receivePosts(posts));
    });
  };
}

export const REQUEST_PROFILES = 'REQUEST_PROFILES';

export function requestProfiles() {
  return {
    type: REQUEST_PROFILES
  };
}

export const RECEIVE_PROFILES = 'RECEIVE_PROFILES';

export function receiveProfiles(profiles) {
  return {
    type: RECEIVE_PROFILES,
    profiles
  };
}

export function fetchProfiles(query) {
  let path = assembleUrl(config.profiles, query);
  return function(dispatch) {
    dispatch(requestProfiles());
    return fetch(path).then(res => res.json()).then(profiles => {
      dispatch(receiveProfiles(profiles));
    });
  };
}

export const REQUEST_PROFILE = 'REQUEST_PROFILE';

export function requestProfile(id) {
  return {
    type: REQUEST_PROFILE,
    id
  };
}

export const RECEIVE_PROFILE = 'RECEIVE_PROFILE';

export function receiveProfile(profile) {
  return {
    type: RECEIVE_PROFILE,
    profile
  };
}

export function fetchProfile(id) {
  return function (dispatch) {
    dispatch(requestProfile(id));
    return fetch(`${config.profile}/${id}`).then(res => res.json()).then(profile => {
      dispatch(receiveProfile(profile));
    });
  };
}

export const REQUEST_CATES = 'REQUEST_CATES';

export function requestCates() {
  return {
    type: REQUEST_CATES
  };
}

export const RECEIVE_CATES = 'RECEIVE_CATES';

export function receiveCates(cates) {
  return {
    type: RECEIVE_CATES,
    cates
  };
}

export function fetchCates() {
  return function(dispatch) {
    dispatch(requestCates());
    return fetch(config.cates).then(res => res.json()).then(cates => {
      dispatch(receiveCates(cates));
    });
  };
}
