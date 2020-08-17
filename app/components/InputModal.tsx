import React, { Component } from 'react';
import { Input, Modal, Button } from 'semantic-ui-react';
import { debounce } from 'lodash';
import styles from './styles/common.css';

interface Props {
  open: boolean;
  onClose: (arg0: string) => void;
  onExit: () => void;
  header: string;
}

interface State {
  enteredText: string;
  isError: boolean;
}

export default class InputModal extends Component<Props, State> {
  static sanitizeTextInput(text: string) {
    return text.replace(/[|&;$%@"<>()+,./]/g, '');
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      enteredText: '',
      isError: false,
    };
    this.handleTextEntry = debounce(this.handleTextEntry, 100).bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleEnterSubmit = this.handleEnterSubmit.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  handleTextEntry(event, data) {
    this.setState({ enteredText: data.value });
  }

  handleClose() {
    if (this.state.enteredText.length >= 1) {
      this.props.onClose(InputModal.sanitizeTextInput(this.state.enteredText));
    } else {
      this.setState({ isError: true });
    }
  }

  handleExit() {
    this.props.onExit();
  }

  handleEnterSubmit(event: Record<string, any>) {
    if (event.key === 'Enter') {
      this.handleClose();
    }
  }

  render() {
    return (
      <Modal
        dimmer="inverted"
        centered
        className={styles.inputModal}
        open={this.props.open}
        onClose={this.handleExit}
      >
        <Modal.Content>{this.props.header}</Modal.Content>
        <Modal.Content>
          <Input
            focus
            fluid
            error={this.state.isError}
            onChange={this.handleTextEntry}
            onKeyDown={this.handleEnterSubmit}
            autoFocus
          />
        </Modal.Content>
        <Modal.Actions>
          <Button color="blue" content="OK" onClick={this.handleClose} />
        </Modal.Actions>
      </Modal>
    );
  }
}
