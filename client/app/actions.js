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

export const REQUEST_POST = 'REQUEST_POST';

export function requestPost(id) {
  return {
    type: REQUEST_POST,
    id
  };
}

export const RECEIVE_POST = 'RECEIVE_POST';

export function receivePost(post) {
  return {
    type: RECEIVE_POST,
    post
  };
}

export function fetchPost(id) {
  return function (dispatch) {
    dispatch(requestPost(id));
    return fetch(`${config.post}/${id}`).then(res => res.json()).then(post => {
      dispatch(receivePost(post));
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

export function fetchCates(query) {
  const path = assembleUrl(config.cates, query);
  return function(dispatch) {
    dispatch(requestCates());
    return fetch(path).then(res => res.json()).then(cates => {
      dispatch(receiveCates(cates));
    });
  };
}

export const REQUEST_CATE = 'REQUEST_CATE';

export function requestCate(id) {
  return {
    type: REQUEST_CATE,
    id
  };
}

export const RECEIVE_CATE = 'RECEIVE_CATE';

export function receiveCate(cate) {
  return {
    type: RECEIVE_CATE,
    cate
  };
}

export function fetchCate(id) {
  return function (dispatch) {
    dispatch(requestCate(id));
    return fetch(`${config.cate}/${id}`).then(res => res.json()).then(cate => {
      dispatch(receiveCate(cate));
    });
  };
}

// update post
// TODO: 提取公共 http 请求逻辑
export async function updatePost(id, doc) {
  let res = await fetch(`${config.post}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  res = res.json();
  return res;
}

// update profile
export async function updateProfile(id, doc) {
  let res = await fetch(`${config.profile}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  res = res.json();
  return res;
}

// update category
export async function updateCate(id, doc) {
  let res = await fetch(`${config.cate}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  res = res.json();
  return res;
}

// message
export const SHOW_MESSAGE = 'SHOW_MESSAGE';
export const CLOSE_MESSAGE = 'CLOSE_MESSAGE';
let msgTimeout = null;
export function closeMessage() {
  return function(dispatch) {
    dispatch({ type: CLOSE_MESSAGE });
  };
}
export function showMessage(content) {
  return function(dispatch) {
    if (msgTimeout) {
      msgTimeout = null;
      clearTimeout(msgTimeout);
    }
    dispatch({ type: SHOW_MESSAGE, content });
    msgTimeout = setTimeout(() => {
      dispatch({ type: CLOSE_MESSAGE });
    }, 1000);
  };
}

// server side config
export const REQUEST_CONF = 'REQUEST_CONF';
export const RECEIVE_CONF = 'RECEIVE_CONF';
export function fetchConf() {
  return function (dispatch) {
    dispatch({ type: REQUEST_CONF });
    return fetch(config.conf).then(res => res.json()).then(conf => {
      dispatch({ type: RECEIVE_CONF, conf });
    });
  };
}
export async function updateConf(doc) {
  let res = await fetch(config.conf, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  res = res.json();
  return res;
}
