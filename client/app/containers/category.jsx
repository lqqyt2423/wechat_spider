import React from 'react';
import { connect } from 'react-redux';
import { fetchCate } from '../actions';
import Loading from '../components/loading.jsx';
import Paper from 'material-ui/Paper';

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
    const { isFetching, cate } = this.props;
    if (isFetching || !cate.data) return <Loading />;
    return (
      <Paper
        style={{
          padding: '30px',
          margin: '40px 20px'
        }}
      >
        <pre>
          {JSON.stringify(cate.data, null, 4)}
        </pre>
      </Paper>
    );
  }
}

export default connect(state => state)(Category);
