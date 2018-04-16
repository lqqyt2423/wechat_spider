import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducer from './reducers';
import { Router, Route, IndexRoute } from 'react-router';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import { List, ListItem } from 'material-ui/List';
import { createHistory, useBasename } from 'history';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.min.css';
import './style/style.css';
const ENV = process.env.NODE_ENV || 'development';
const BASE_URI = '/';

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

import Posts from './containers/posts.jsx';
import Profiles from './containers/profiles.jsx';
import Profile from './containers/profile.jsx';
import Categories from './containers/categories.jsx';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    let { history } = this.props;
    return (
      <MuiThemeProvider>
        <div>
          <Drawer width={100} open={true} >
            <AppBar title="首页" style={{ padding: '0 16px' }} showMenuIconButton={false} titleStyle={{ 'cursor': 'pointer' }} onTitleTouchTap={() => { history.push('/'); }} />
            <List>
              <ListItem primaryText="文章" onClick={() => { history.push('/posts'); }} />
              <ListItem primaryText="公众号" onClick={() => { history.push('/profiles'); }} />
              <ListItem primaryText="分类" onClick={() => { history.push('/categories'); }} />
            </List>
          </Drawer>
          <div className="wrapper">
            {this.props.children}
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

const connectedApp = connect(state => state)(App);

const browserHistory = useBasename(createHistory)({
  basename: BASE_URI
});

render(
  (
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path="/" component={connectedApp}>
          <IndexRoute component={Posts} />
          <Route path="/posts" component={Posts} />
          <Route path="/profiles" component={Profiles} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/categories" component={Categories} />
        </Route>
      </Router>
    </Provider>
  ),
  document.getElementById('app')
);
