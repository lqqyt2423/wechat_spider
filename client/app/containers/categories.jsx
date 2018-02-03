import React from 'react';
import { connect } from 'react-redux';
import { fetchCates } from '../actions';
import Loading from '../components/loading.jsx';
import { Card, CardActions, CardTitle } from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';


class Categories extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchCates());
  }

  render() {
    let { cates, isFetching, history } = this.props;
    if (isFetching || !cates.length) return <Loading />;
    return (
      <div>
        {
          cates.map(cate => {
            return (
              <Card key={cate._id}>
                <CardTitle title={cate.name} />
                <CardActions>
                  <FlatButton label="Profiles" onClick={() => { history.push(`/profiles?category=${cate._id}`); }} />
                  <FlatButton label="Posts"  onClick={() => { history.push(`/posts?category=${cate._id}`); }} />
                </CardActions>
              </Card>
            );
          })
        }
      </div>
    );
  }
}

export default connect(state => state)(Categories);
