// @flow
import React, { Component } from 'react';
import { Input, Modal, Button } from 'semantic-ui-react';
import { debounce } from 'lodash';
import styles from './styles/common.css';

interface Props {
  open: boolean;
  onClose: string => void;
  header: string;
}

interface State {
  enteredText: string;
  isError: boolean;
}

export default class InputModal extends Component<Props, State> {
  props: Props;
  state: State;
  handleTextEntry: (Object, Object) => void;
  handleClose: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      enteredText: '',
      isError: false
    };
    this.handleTextEntry = debounce(this.handleTextEntry, 500).bind(this);
  }

  handleTextEntry(event, data) {
    this.setState({ enteredText: data.value });
  }

  handleClose() {
    if (this.state.enteredText.length > 1) {
      this.props.onClose(this.state.enteredText);
    }
    this.setState({ isError: true });
  }

  render() {
    return (
      <Modal
        basic
        centered
        dimmer="inverted"
        className={styles.inputModal}
        open={this.props.open}
        onClose={() => this.props.onClose(this.state.enteredText)}
      >
        <Modal.Content>{this.props.header}</Modal.Content>
        <Modal.Content>
          <Input
            focus
            fluid
            error={this.state.isError}
            onChange={this.handleTextEntry}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button color="blue" content="OK" onClick={this.handleClose} />
        </Modal.Actions>
      </Modal>
    );
  }
}
