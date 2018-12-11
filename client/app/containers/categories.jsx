import React from 'react';
import { connect } from 'react-redux';
import { fetchCates } from '../actions';
import Loading from '../components/loading.jsx';
import { Link } from 'react-router';
import Paginator from '../components/paginator.jsx';


class Categories extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, location } = this.props;
    dispatch(fetchCates(location.query));
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      const { dispatch } = this.props;
      dispatch(fetchCates(nextProps.location.query));
    }
  }

  render() {
    const { cates, isFetching, history, location } = this.props;
    const { search, pathname } = location;
    if (isFetching || !cates.data) return <Loading />;

    const { metadata, data } = cates;

    return (
      <div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>分类名</th>
              <th>公众号数量</th>
              <th>公众号</th>
              <th>文章</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {
              data.map(i => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td>{i.name}</td>
                  <td>{i.msgBizs.length}</td>
                  <td><Link to={`/profiles?category=${i.id}`}>详情</Link></td>
                  <td><Link to={`/posts?category=${i.id}`}>详情</Link></td>
                  <td><Link to={`/categories/${i.id}`}>详情</Link></td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Paginator {...metadata} history={history} search={search} pathname={pathname} ></Paginator>
      </div>
    );
  }
}

export default connect(state => state)(Categories);
