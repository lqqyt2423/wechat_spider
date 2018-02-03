import React from 'react';
import { connect } from 'react-redux';

class Home extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>hello world</div>
    );
  }
}

export default connect(state => state)(Home);
