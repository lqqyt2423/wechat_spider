import { REQUEST_POSTS, RECEIVE_POSTS, REQUEST_PROFILES, RECEIVE_PROFILES } from './actions';

const initialState = {
  posts: {},
  profiles: {},
  isFetching: false
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_POSTS:
    case REQUEST_PROFILES:
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
      })
    default:
      return state;
  }
}

export default reducer;