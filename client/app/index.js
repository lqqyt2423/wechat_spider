import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducer from './reducers';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import 'normalize.css';
import './style/style.css';
const ENV = process.env.NODE_ENV || 'development';

import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

let reduxMiddlewares = [thunkMiddleware];
if (ENV === 'development') {
  reduxMiddlewares.push(createLogger);
}
let store = createStore(
  reducer,
  applyMiddleware(...reduxMiddlewares)
);

import Posts from './containers/posts';
import Profiles from './containers/profiles';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <AppBar
            title={<div>Home</div>}
          />
          <div className="wrapper">
            {this.props.children}
          </div>
        </div>
      </MuiThemeProvider>
    )
  }
}

const connectedApp = connect(state => state)(App);

render(
  (
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path="/" component={connectedApp}>
          <IndexRoute component={Posts} />
          <Route path="/profiles" component={Profiles} />
        </Route>
      </Router>
    </Provider>
  ),
  document.getElementById('app')
);
