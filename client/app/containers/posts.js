import React from 'react';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import { connect } from 'react-redux';
import { fetchPosts } from '../actions';
import Loading from '../components/loading';
import moment from 'moment';
import Paginator from '../components/Paginator';

class Posts extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchPosts());
  }

  render() {
    let { isFetching, posts, dispatch } = this.props;
    if (isFetching || !posts.data) return <Loading />;
    let metadata = posts.metadata;
    return (
      <div>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>发布时间</th>
              <th>更新数据时间</th>
              <th>时间间隔</th>
              <th>文章标题</th>
              <th>公众号</th>
              <th>阅读数</th>
              <th>点赞数</th>
              <th>链接</th>
            </tr>
          </thead>
          <tbody>
            {
              posts.data.map(post => {
                return (
                  <tr key={post._id}>
                    <td>{moment(post.publishAt).format('YYYY/MM/DD HH:mm')}</td>
                    <td>{post.updateNumAt ? moment(post.updateNumAt).format('YYYY/MM/DD HH:mm') : ''}</td>
                    <td>{post.updateNumAt ? `${((new Date(post.updateNumAt).getTime() - new Date(post.publishAt).getTime())/1000/60/60/24).toFixed(1)}天` : ''}</td>
                    <td>{post.title}</td>
                    <td>{post.profile ? post.profile.title : post.msgBiz}</td>
                    <td>{post.readNum ? post.readNum : ''}</td>
                    <td>{post.likeNum ? post.likeNum : ''}</td>
                    <td><a href={post.link} target="_blank">打开</a></td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <Paginator { ...metadata } dispatch={ dispatch } query={{}} action={ fetchPosts }></Paginator>
      </div>
    )
  }
}

export default connect(state => state)(Posts);