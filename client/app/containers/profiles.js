import React from 'react';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import { connect } from 'react-redux';
import { fetchProfiles } from '../actions';
import Loading from '../components/loading';

class Profiles extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchProfiles());
  }

  render() {
    let { isFetching } = this.props;
    if (isFetching) return <Loading />;
    return (
      <div>
        hello profiles
      </div>
    )
  }
}

export default connect(state => state)(Profiles);