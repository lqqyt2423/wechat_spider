import React from 'react';
import { connect } from 'react-redux';
import { fetchProfile } from '../actions';
import Loading from '../components/loading.jsx';
import Paper from 'material-ui/Paper';
import Avatar from 'material-ui/Avatar';
import moment from 'moment';

function f(date) {
  if (date) {
    return moment(new Date(date)).format('YYYY-MM-DD HH:mm');
  } else {
    return date;
  }
}

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
    const { isFetching, profile, params } = this.props;
    const { id } = params;
    if (isFetching) return <Loading />;
    if (id !== profile.id) return <Loading />;
    return (
      <Paper
        style={{
          padding: '30px',
          margin: '40px 20px'
        }}
      >
        <h2>
          <Avatar
            src={profile.headimg}
            size={60}
            style={{ marginRight: '15px' }}
          />
          {profile.title}
        </h2>
        <div style={{
          fontSize: '16px',
          marginTop: '20px'
        }}>
          <p>微信ID：{profile.wechatId}</p>
          <p>msgBiz：{profile.msgBiz}</p>
          <p>创建时间：{f(profile.createdAt)}</p>
          <p>更新时间：{f(profile.updatedAt)}</p>
          <p>上次打开历史页面时间：{f(profile.openHistoryPageAt)}</p>
          <p>属性：{profile.property}</p>
        </div>
      </Paper>
    );
  }
}

export default connect(state => state)(Profile);
