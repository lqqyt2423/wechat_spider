import React from 'react';
import { connect } from 'react-redux';
import { fetchProfiles } from '../actions';
import Loading from '../components/loading.jsx';
import moment from 'moment';
import Paginator from '../components/paginator.jsx';
import { Link } from 'react-router';
import Search from './search.jsx';

class Profiles extends React.Component {

  constructor(props) {
    super(props);
    this.returnCurrentSearchArgs = this.returnCurrentSearchArgs.bind(this);
  }

  componentDidMount() {
    let { dispatch, location } = this.props;
    dispatch(fetchProfiles(location.query));
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      let { dispatch } = this.props;
      dispatch(fetchProfiles(nextProps.location.query));
    }
  }

  returnCurrentSearchArgs() {
    const { location } = this.props;
    const { search } = location;
    const searchArgs = {};
    search.replace('?', '').split('&').forEach(item => {
      let key = item.split('=')[0];
      let value = item.replace(`${key}=`, '');
      if (key && value) searchArgs[key] = value;
    });
    return searchArgs;
  }

  render() {
    let { isFetching, profiles, history, location } = this.props;
    let { search, pathname } = location;
    if (isFetching || !profiles.data) return <Loading />;
    let metadata = profiles.metadata;
    return (
      <div>
        <Search
          location={location}
          history={history}
          searchArgs={this.returnCurrentSearchArgs()}
          defaultText="搜索公众号..."
        />
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>更新时间</th>
              <th>头像</th>
              <th>公众号</th>
              <th>最新</th>
              <th>最旧</th>
              <th>文章数</th>
              <th>有数据</th>
              <th>差</th>
              <th>MsgBiz</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {
              profiles.data.map(profile => {
                return (
                  <tr key={profile.id}>
                    <td>{profile.id}</td>
                    <td>{profile.openHistoryPageAt ? moment(profile.openHistoryPageAt).format('YY-MM-DD HH:mm') : ''}</td>
                    <td><img style={{ height: '24px', marginRight: '3px' }} src={profile.headimg} className="img-circle" /></td>
                    <td><Link to={`/posts?msgBiz=${profile.msgBiz}`}>{profile.title}</Link></td>
                    <td>{profile.newestPostTime ? moment(profile.newestPostTime).format('YY-MM-DD'): ''}</td>
                    <td>{profile.oldestPostTime ? moment(profile.oldestPostTime).format('YY-MM-DD'): ''}</td>
                    <td>{profile.postsAllCount}</td>
                    <td>{profile.postsHasDataCount}</td>
                    <td>{profile.postsAllCount - profile.postsHasDataCount}</td>
                    <td>{profile.msgBiz}</td>
                    <td><Link to={`/profiles/${profile.id}`}>详情</Link></td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <Paginator { ...metadata } history={ history } search={ search } pathname={ pathname } ></Paginator>
      </div>
    );
  }
}

export default connect(state => state)(Profiles);
