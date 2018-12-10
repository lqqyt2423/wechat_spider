import React from 'react';
import { connect } from 'react-redux';
import { fetchCate, updateCate, showMessage } from '../actions';
import Loading from '../components/loading.jsx';
import Edit from '../components/edit.jsx';

class Category extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { params, dispatch } = this.props;
    const { id } = params;
    dispatch(fetchCate(id));
  }

  render() {
    const { isFetching, cate, location, params, dispatch, history } = this.props;
    const { id } = params;
    const { pathname } = location;
    const isEdit = /edit$/.test(pathname);
    if (isFetching || !cate.data) return <Loading />;

    return (
      <div>
        <Edit
          isEdit={isEdit}
          pathname={pathname}
          dispatch={dispatch}
          history={history}
          content={JSON.stringify(cate.data, null, 4)}
          onSave={async (doc) => {
            const res = await updateCate(id, doc);
            if ([1, 2].includes(res.state)) dispatch(showMessage(res.message));
            if ([0, 1].includes(res.state)) {
              dispatch(fetchCate(id));
              history.replace(`/categories/${id}`);
            }
          }}
        />
      </div>
    );
  }
}

export default connect(state => state)(Category);
