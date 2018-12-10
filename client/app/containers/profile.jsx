import React from 'react';
import { connect } from 'react-redux';
import { fetchProfile, updateProfile, showMessage } from '../actions';
import Loading from '../components/loading.jsx';
import Edit from '../components/edit.jsx';

class Profile extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { params, dispatch } = this.props;
    const { id } = params;
    dispatch(fetchProfile(id));
  }

  render() {
    const { isFetching, profile, location, params, dispatch, history } = this.props;
    const { id } = params;
    const { pathname } = location;
    const isEdit = /edit$/.test(pathname);
    if (isFetching || !profile.data) return <Loading />;

    return (
      <div>
        <Edit
          isEdit={isEdit}
          pathname={pathname}
          dispatch={dispatch}
          history={history}
          content={JSON.stringify(profile.data, null, 4)}
          onSave={async (doc) => {
            const res = await updateProfile(id, doc);
            if ([1, 2].includes(res.state)) dispatch(showMessage(res.message));
            if ([0, 1].includes(res.state)) {
              dispatch(fetchProfile(id));
              history.replace(`/profiles/${id}`);
            }
          }}
        />
      </div>
    );
  }
}

export default connect(state => state)(Profile);
