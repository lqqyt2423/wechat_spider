import React from 'react';
import RefreshIndicator from 'material-ui/RefreshIndicator';

const style = {
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%'
  },
  refresh: {
    display: 'inline-block',
    position: 'relative'
  },
};

const Loading = () => (
  <div style={style.container}>
    <RefreshIndicator
      size={50}
      left={-25}
      top={-25}
      status="loading"
      style={style.refresh}
    />
  </div>
);

export default Loading;
