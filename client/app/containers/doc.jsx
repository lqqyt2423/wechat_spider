import React from 'react';
import { connect } from 'react-redux';
import {
  showMessage,
  fetchPost,
  updatePost,
  fetchProfile,
  updateProfile,
  fetchConf,
  updateConf,
} from '../actions';
import Loading from '../components/loading.jsx';
import Edit from '../components/edit.jsx';

class Doc extends React.Component {
  constructor(props) {
    super(props);
  }

  initDoc(props) {
    const { location, params, dispatch } = props;
    const { pathname } = location;
    if (pathname.includes('posts')) {
      this.fetchFn = fetchPost;
      this.updateFn = updatePost;
      this.stateName = 'post';
      this.statePath = 'posts';
    } else if (pathname.includes('profiles')) {
      this.fetchFn = fetchProfile;
      this.updateFn = updateProfile;
      this.stateName = 'profile';
      this.statePath = 'profiles';
    } else if (pathname.includes('conf')) {
      this.fetchFn = fetchConf;
      this.updateFn = updateConf;
      this.stateName = 'conf';
      this.statePath = 'conf';
    } else {
      throw new Error('invalide pathname');
    }

    const { id } = params;
    if (id) {
      dispatch(this.fetchFn(id));
    } else {
      dispatch(this.fetchFn());
    }
  }

  componentDidMount() {
    this.initDoc(this.props);
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    // 路由变化，重新请求接口
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.initDoc(nextProps);
    }
  }

  render() {
    if (!this.fetchFn) return <Loading />;
    const { isFetching, location, params, dispatch, history } = this.props;
    const { id } = params;
    const { pathname } = location;
    const isEdit = /edit$/.test(pathname);
    const doc = this.props[this.stateName].data;
    if (isFetching || !doc) return <Loading />;

    return (
      <div>
        <Edit
          isEdit={isEdit}
          pathname={pathname}
          history={history}
          dispatch={dispatch}
          content={JSON.stringify(doc, null, 4)}
          onSave={async (doc) => {
            let res;
            if (id) {
              res = await this.updateFn(id, doc);
            } else {
              res = await this.updateFn(doc);
            }
            if ([1, 2].includes(res.state)) dispatch(showMessage(res.message));
            if ([0, 1].includes(res.state)) {
              if (id) {
                dispatch(this.fetchFn(id));
                history.replace(`/${this.statePath}/${id}`);
              } else {
                dispatch(this.fetchFn());
                history.replace(`/${this.statePath}`);
              }
            }
          }}
        />
      </div>
    );
  }
}

export default connect(state => state)(Doc);
