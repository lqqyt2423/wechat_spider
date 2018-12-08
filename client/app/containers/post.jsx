import React from 'react';
import { connect } from 'react-redux';
import { fetchPost } from '../actions';
import Loading from '../components/loading.jsx';
import Paper from 'material-ui/Paper';

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
    const { isFetching, post } = this.props;
    if (isFetching || !post.data) return <Loading />;
    return (
      <Paper
        style={{
          padding: '30px',
          margin: '40px 20px'
        }}
      >
        <pre>
          {JSON.stringify(post.data, null, 4)}
        </pre>
      </Paper>
    );
  }
}

export default connect(state => state)(Post);
