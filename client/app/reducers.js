import {
  REQUEST_POSTS,
  RECEIVE_POSTS,
  REQUEST_PROFILES,
  RECEIVE_PROFILES,
  REQUEST_PROFILE,
  RECEIVE_PROFILE,
  REQUEST_CATES,
  RECEIVE_CATES
} from './actions';

const initialState = {
  posts: {},
  profiles: {},
  profile: {},
  cates: [],
  isFetching: false
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_POSTS:
    case REQUEST_PROFILES:
    case REQUEST_PROFILE:
    case REQUEST_CATES:
      return Object.assign({}, state, {
        isFetching: true
      });
    case RECEIVE_POSTS:
      return Object.assign({}, state, {
        isFetching: false,
        posts: action.posts
      });
    case RECEIVE_PROFILES:
      return Object.assign({}, state, {
        isFetching: false,
        profiles: action.profiles
      });
    case RECEIVE_PROFILE:
      return {
        ...state,
        isFetching: false,
        profile: action.profile
      };
    case RECEIVE_CATES:
      return Object.assign({}, state, {
        isFetching: false,
        cates: action.cates
      });
    default:
      return state;
  }
}

export default reducer;
