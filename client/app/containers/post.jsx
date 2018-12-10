import React from 'react';
import { connect } from 'react-redux';
import { fetchPost, updatePost, showMessage } from '../actions';
import Loading from '../components/loading.jsx';
import Edit from '../components/edit.jsx';

class Post extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { params, dispatch } = this.props;
    const { id } = params;
    dispatch(fetchPost(id));
  }

  render() {
    const { isFetching, post, location, params, dispatch, history } = this.props;
    const { id } = params;
    const { pathname } = location;
    const isEdit = /edit$/.test(pathname);
    if (isFetching || !post.data) return <Loading />;

    return (
      <div>
        <Edit
          isEdit={isEdit}
          pathname={pathname}
          history={history}
          dispatch={dispatch}
          content={JSON.stringify(post.data, null, 4)}
          onSave={async (doc) => {
            const res = await updatePost(id, doc);
            if ([1, 2].includes(res.state)) dispatch(showMessage(res.message));
            if ([0, 1].includes(res.state)) {
              dispatch(fetchPost(id));
              history.replace(`/posts/${id}`);
            }
          }}
        />
      </div>
    );
  }
}

export default connect(state => state)(Post);
