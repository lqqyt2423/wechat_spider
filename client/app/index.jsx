import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducer from './reducers';
import { closeMessage } from './actions';
import Dialog from 'material-ui/Dialog';
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
import Doc from './containers/doc.jsx';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { history, message, dispatch } = this.props;
    return (
      <MuiThemeProvider>
        <div>
          <Drawer width={100} open={true} >
            <AppBar title="首页" style={{ padding: '0 16px' }} showMenuIconButton={false} titleStyle={{ 'cursor': 'pointer' }} onTitleTouchTap={() => { history.push('/'); }} />
            <List>
              <ListItem primaryText="文章" onClick={() => { history.push('/posts'); }} />
              <ListItem primaryText="公众号" onClick={() => { history.push('/profiles'); }} />
              <ListItem primaryText="配置" onClick={() => { history.push('/conf'); }} />
              <a href="https://github.com/lqqyt2423/wechat_spider" target="_blank" rel="noopener noreferrer"><ListItem primaryText="GitHub" /></a>
            </List>
          </Drawer>
          <div className="wrapper">
            {this.props.children}
          </div>
          <Dialog
            open={message.open}
            onRequestClose={() => {
              dispatch(closeMessage());
            }}
          >
            {message.content}
          </Dialog>
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
          <Route path="/posts/:id" component={Doc} />
          <Route path="/posts/:id/edit" component={Doc} />
          <Route path="/profiles" component={Profiles} />
          <Route path="/profiles/:id" component={Doc} />
          <Route path="/profiles/:id/edit" component={Doc} />
          <Route path="/conf" component={Doc} />
          <Route path="/conf/edit" component={Doc} />
        </Route>
      </Router>
    </Provider>
  ),
  document.getElementById('app')
);
