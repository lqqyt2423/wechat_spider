import React from 'react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import { showMessage } from '../actions';

export default class Edit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: props.content,
    };
    this.onClickSave = this.onClickSave.bind(this);
  }

  async onClickSave() {
    let { content } = this.state;
    const { onSave, dispatch } = this.props;
    try {
      content = JSON.parse(content);
    } catch(e) {
      dispatch(showMessage('解析文档错误，请检查'));
      return;
    }
    onSave(content);
  }

  render() {
    const { content } = this.state;
    const { isEdit, pathname, history } = this.props;
    let showContent;
    if (!isEdit) {
      showContent = (
        <div>
          <pre>
            {content}
          </pre>
          <RaisedButton
            style={{ marginTop: '10px' }}
            label="编辑"
            onClick={() => {
              history.replace(`/${pathname}/edit`);
            }}
          />
        </div>
      );
    } else {
      showContent = (
        <div>
          <textarea
            style={{
              width: '100%',
              height: '350px',
              padding: '5px',
              fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier',
              outline: 'none',
              wordBreak: 'break-all',
            }}
            value={content}
            onChange={event => {
              this.setState({ content: event.target.value });
            }}
          />
          <RaisedButton
            style={{ marginTop: '10px' }}
            primary={true}
            label="保存"
            onClick={this.onClickSave}
          />
        </div>
      );
    }
    return (
      <Paper
        style={{
          padding: '30px',
          margin: '40px 20px'
        }}
      >
        {showContent}
      </Paper>
    );
  }
}
