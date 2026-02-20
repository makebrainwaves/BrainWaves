import React, { Component } from 'react';
import { Input, Modal, Button, InputOnChangeData } from 'semantic-ui-react';
import { sanitizeTextInput } from '../utils/ui';
import styles from './styles/common.css';

interface InputData {
  subject: string;
  group: string;
  session: number;
}
interface Props {
  open: boolean;
  data: InputData;
  onClose: (subject: string, group: string, session: number) => void;
  onExit: () => void;
  header: string;
}

interface State {
  subject: string;
  group: string;
  session: number;
  isSubjectError: boolean;
  isSessionError: boolean;
}

export default class InputCollect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      subject: this.props.data && this.props.data.subject,
      group: this.props.data && this.props.data.group,
      session: this.props.data && this.props.data.session,
      isSubjectError: false,
      isSessionError: false,
    };
    this.handleTextEntry = this.handleTextEntry.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleEnterSubmit = this.handleEnterSubmit.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  handleTextEntry(data: InputOnChangeData, field: keyof InputData) {
    switch (field) {
      case 'session':
        this.setState({ [field]: parseInt(data.value, 10) });
        break;
      case 'group':
        this.setState({ [field]: data.value });
        break;
      case 'subject':
      default:
        this.setState({ subject: data.value });
    }
  }

  handleClose() {
    if (this.state.subject.length >= 1 && this.state.session) {
      this.props.onClose(
        sanitizeTextInput(this.state.subject),
        sanitizeTextInput(this.state.group),
        this.state.session
      );
    } else {
      if (this.state.subject.length < 1) {
        this.setState({ isSubjectError: true });
      }
      if (!this.state.session) {
        this.setState({ isSessionError: true });
      }
    }
  }

  handleExit() {
    this.props.onExit();
  }

  handleEnterSubmit(event: KeyboardEvent) {
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
        <Modal.Content>
          Enter Subject ID
          <Input
            focus
            fluid
            error={this.state.isSubjectError}
            onChange={(object, data) => this.handleTextEntry(data, 'subject')}
            onKeyDown={this.handleEnterSubmit}
            value={this.state.subject}
            autoFocus
          />
        </Modal.Content>
        <Modal.Content>
          Enter group name (optional)
          <Input
            focus
            fluid
            onChange={(object, data) => this.handleTextEntry(data, 'group')}
            onKeyDown={this.handleEnterSubmit}
            value={this.state.group}
          />
        </Modal.Content>
        <Modal.Content>
          Enter session number
          <Input
            focus
            fluid
            error={this.state.isSessionError}
            onChange={(object, data) => this.handleTextEntry(data, 'session')}
            onKeyDown={this.handleEnterSubmit}
            value={this.state.session}
            type="number"
          />
        </Modal.Content>
        <Modal.Actions>
          <Button color="blue" content="OK" onClick={this.handleClose} />
        </Modal.Actions>
      </Modal>
    );
  }
}
