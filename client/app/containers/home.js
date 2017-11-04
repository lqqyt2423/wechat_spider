import React from 'react';
import { connect } from 'react-redux';
import { fetchPosts, assembleUrl } from '../actions';
import Loading from '../components/loading';
import moment from 'moment';
import { Link } from 'react-router';
import io from 'socket.io-client';

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

class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      posts: null
    };
  }

  componentDidMount() {
    const socket = io('http://localhost:8004');
    socket.on('connect', () => {
      console.log('socket connect');
    });
    socket.on('disconnect', () => {
      console.log('socket disconnect');
    });
    socket.on('message', data => {
      this.setState({
        posts: JSON.parse(data)
      });
    });
  }

  render() {
    let posts = this.state.posts;
    if (!posts || !posts.data) return <Loading />;
    let metadata = posts.metadata;
    return (
      <div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>发布时间</th>
              <th>更新时间</th>
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
      </div>
    )
  }
}

export default connect(state => state)(Home);