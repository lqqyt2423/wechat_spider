import React from 'react';
import { connect } from 'react-redux';
import { fetchPosts, assembleUrl } from '../actions';
import Loading from '../components/loading';
import Paginator from '../components/Paginator';
import moment from 'moment';
import { Link } from 'react-router';

function timeDiff(update, publish) {
  let updateMoment = moment(update);
  let publishMoment = moment(publish);
  let days = updateMoment.diff(publishMoment, 'days');
  if (days < 31) return `${days}天`;
  let months = updateMoment.diff(publishMoment, 'months');
  if (months < 13) return `${months}月`;
  let years = updateMoment.diff(publishMoment, 'years');
  return `${years}年`;
}

class Posts extends React.Component {

  constructor(props) {
    super(props);
    this.sortByTime = this.sortByTime.bind(this);
  }

  componentDidMount() {
    let { dispatch, location } = this.props;
    dispatch(fetchPosts(location.query));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      let { dispatch } = this.props;
      dispatch(fetchPosts(nextProps.location.query));
    }
  }

  sortByTime(sortType) {
    let { location, history } = this.props;
    let { search, pathname } = location;
    let iconClass = 'fa-sort';
    let nextSortType = `-${sortType}`;
    let searchObj = {};
    search.replace('?', '').split('&').forEach(item => {
      let key = item.split('=')[0];
      let value = item.replace(`${key}=`, '');
      searchObj[key] = value;
    });
    if (search && search.indexOf('?') === 0) {
      if (searchObj.sortWay) {
        if (searchObj.sortWay === sortType) {
          iconClass = 'fa-sort-asc';
          nextSortType = `-${sortType}`;
        }
        if (searchObj.sortWay === `-${sortType}`) {
          iconClass = 'fa-sort-desc';
          nextSortType = sortType;
        }
      }
    }
    let nextQuery = Object.assign({}, searchObj, {
      sortWay: nextSortType
    });
    let path = assembleUrl(pathname, nextQuery);
    return (<i onClick={() => { history.push(path) }} className={`fa ${iconClass}`}></i>);
  }

  render() {
    let { isFetching, posts, history, location } = this.props;
    let { search, pathname } = location;
    if (isFetching || !posts.data) return <Loading />;
    let metadata = posts.metadata;
    return (
      <div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>发布时间 {this.sortByTime('publishAt')}</th>
              <th>更新时间 {this.sortByTime('updateNumAt')}</th>
              <th>时间间隔</th>
              <th>文章标题</th>
              <th>位置</th>
              <th>公众号</th>
              <th>阅读数</th>
              <th>点赞数</th>
            </tr>
          </thead>
          <tbody>
            {
              posts.data.map(post => {
                return (
                  <tr key={post._id}>
                    <td>{moment(post.publishAt).format('YY-MM-DD HH:mm')}</td>
                    <td>{post.updateNumAt ? moment(post.updateNumAt).format('YY-MM-DD HH:mm') : ''}</td>
                    <td>{post.updateNumAt ? timeDiff(post.updateNumAt, post.publishAt) : ''}</td>
                    <td><a title={post.title} href={post.link} target="_blank">{post.title.substr(0, 30)}</a></td>
                    <td>{post.msgIdx}</td>
                    <td><Link to={`/posts?msgBiz=${post.msgBiz}`}>{post.profile ? (<span><img style={{ height: '24px', marginRight: '3px' }} src={post.profile.headimg} className="img-circle" />{post.profile.title}</span>) : post.msgBiz}</Link></td>
                    <td>{post.readNum ? post.readNum : ''}</td>
                    <td>{post.likeNum ? post.likeNum : ''}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <Paginator { ...metadata } history={ history } search={ search } pathname={ pathname } ></Paginator>
      </div>
    )
  }
}

export default connect(state => state)(Posts);