import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import assign from 'lodash.assign';
import get from 'lodash/get';
import set from 'lodash/set';
import { assembleUrl } from '../actions';

class Paginator extends React.Component {
  static get propTypes() {
    return {
      // action: PropTypes.func.isRequired,
      // dispatch: PropTypes.func.isRequired,
      action: PropTypes.func,
      dispatch: PropTypes.func,
      currentPage: PropTypes.number,
      perPage: PropTypes.number,
      totalPages: PropTypes.number,
      pager: PropTypes.number,
      query: PropTypes.object,
      onChange: PropTypes.func
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      perPage: props.perPage || 10,
      Page: 1
    };
  }

  getValue(name) {
    return get(this.state, name);
  }

  handleChange(name, callback) {
    return (e) => {
      let self = this;
      if (e.target.type === 'file') {
        if (!e.target.files.length) return;
        let file = e.target.files[0];
        this.handleFileUpload(file).then(function(data) {
          let newState = assign({}, self.state);
          set(newState, name, data.data.id);
          self.setState(newState, callback);
        });
      } else {
        let newState = assign({}, self.state);
        set(newState, name, e.target.value);
        self.setState(newState, callback);
      }
    };
  }

  loadPage(page, overwrite) {
    return () => {
      let { query, onChange, pathname, search, history } = this.props;
      let { perPage } = this.state;
      if (perPage > 50) perPage = 50;
      if (search && search.indexOf('?') === 0) {
        let searchObj = {};
        search.replace('?', '').split('&').forEach(item => {
          let key = item.split('=')[0];
          let value = item.replace(`${key}=`, '');
          searchObj[key] = value;
        });
        query = assign({}, query, searchObj);
      }
      query = assign({}, query, { page, perPage });
      if (overwrite) query._overwrite = true;

      if (typeof onChange === 'function') onChange(page, perPage);

      // dispatch(action(query));
      let path = assembleUrl(pathname, query);
      history.push(path);
    };
  }

  renderPage(obj) {
    obj = obj || {};
    return (
      <li className={ classnames({ disabled: obj.disabled, active: obj.active }) } key={Math.random()}>
        <a href="javascript:void(0)" onClick={ obj.disabled || obj.active ? function(){} : this.loadPage(obj.page) }>
          <span aria-hidden="true">{ obj.name || '' }</span>
        </a>
      </li>
    );
  }

  handlePerPageChange() {
    const { currentPage } = this.props;
    if (this._isRefreshingOnPerPageChange) clearTimeout(this._isRefreshingOnPerPageChange);

    this._isRefreshingOnPerPageChange = setTimeout(() => {
      this.loadPage(currentPage, true)();
    }, 300);
  }

  changePage(e) {
    const { totalPages } = this.props;
    let Page = e.target.previousSibling.value||1;
    if(Page>totalPages) Page = totalPages;
    if(Page<1) Page = 1;

    this.loadPage(Page)();
  }

  handleChangePage(e) {
    const { totalPages } = this.props;
    let value = e.target.value;
    if(value > totalPages) value = totalPages;
    if(value < 1) value = '';
    this.setState({Page: value});
  }

  render() {
    let self = this;
    let { currentPage, totalPages, pager, count } = this.props;
    currentPage = currentPage || 1;
    totalPages = totalPages || 1;
    pager = pager || 5;
    let minPage = currentPage - pager;
    let maxPage = currentPage + pager;

    function renderMiddlePages() {
      let pages = [];
      for (let i = 1; i <= totalPages; i++) {
        if (i > minPage && i < maxPage) {
          pages.push(self.renderPage({ active: currentPage == i, page: i, name: i }));
        }
      }

      return pages;
    }

    if (totalPages == 1) return null;

    return (
      <nav>
        <ul className="pagination">
          { currentPage > 5 ? this.renderPage({ active: currentPage == 1, page: 1, name: '第一页' }) : ''}
          { this.renderPage({ disabled: currentPage == 1, page: currentPage - 1, name: '上一页' }) }
          { minPage > 1 ? this.renderPage({ page: minPage, name: '...' }) : '' }
          { renderMiddlePages() }
          { maxPage < totalPages ? this.renderPage({ page: maxPage, name: '...' }) : '' }
          { this.renderPage({ disabled: currentPage >= totalPages, page: currentPage + 1, name: '下一页' }) }
          { maxPage < totalPages ? this.renderPage({ active: currentPage >= totalPages, page: totalPages, name: '最后一页' }) : '' }
        </ul>
        <div className="margin-left-10 inline-block pull-right margin-right-10" style={{padding: '30px 0'}}>
          <input type="text"
            value={this.state.Page}
            onChange={this.handleChangePage.bind(this)}
            style={{display: 'inline-block', width:'40px',marginRight:'10px'}}/>
          <button className="btn btn-primary btn-xs"
            onClick={this.changePage.bind(this)}>跳转</button>
        </div>
        <div className='pagination-per-page' style={{ float: 'right', padding: '30px 0' }}>
          共 {count} 个
          每页
          <input type="number"
            style={{ marginLeft: '5px', marginRight: '5px' }}
            min='1'
            max='50'
            value={this.getValue('perPage')}
            onChange={ this.handleChange('perPage', this.handlePerPageChange.bind(this)) }
            required="required" />
          个，共 {totalPages} 页
        </div>
      </nav>
    );
  }
}

export default Paginator;
