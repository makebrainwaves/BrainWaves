
import React, { Component } from "react";
import { Input, Modal, Button } from "semantic-ui-react";
import { debounce } from "lodash";
import styles from "./styles/common.css";

interface Props {
  open: boolean;
  onClose: (arg0: string) => void;
  onExit: (arg0: string) => void;
  header: string;
}

interface State {
  subject: string;
  group: string;
  session: number;
  isError: boolean;
  isSubjectError: boolean;
  isSessionError: boolean;
}

export default class InputCollect extends Component<Props, State> {

  // handleClose: () => void;
  // handleExit: () => void;
  // handleEnterSubmit: (Object) => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      subject: this.props.data && this.props.data.subject,
      group: this.props.data && this.props.data.group,
      session: this.props.data && this.props.data.session,
      isError: false,
      isSubjectError: false,
      isSessionError: false
    };
    this.handleTextEntry = this.handleTextEntry.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleEnterSubmit = this.handleEnterSubmit.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  sanitizeTextInput(text: string) {
    return text.replace(/[|&;$%@"<>()+,./]/g, '');
  }

  handleTextEntry(event, data, field) {
    const val = field === 'session' ? parseInt(data.value) : data.value;
    this.setState({ [field]: val });
  }

  handleClose() {
    if (this.state.subject.length >= 1 && this.state.session) {
      this.props.onClose(this.sanitizeTextInput(this.state.subject), this.sanitizeTextInput(this.state.group), this.state.session);
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

  handleEnterSubmit(event: Object) {
    if (event.key === 'Enter') {
      this.handleClose();
    }
  }

  render() {
    return <Modal dimmer='inverted' centered className={styles.inputModal} open={this.props.open} onClose={this.handleExit}>
        <Modal.Content>
          Enter Subject ID
          <Input focus fluid error={this.state.isSubjectError} onChange={(object, data) => this.handleTextEntry(object, data, 'subject')} onKeyDown={this.handleEnterSubmit} value={this.state.subject} autoFocus />
        </Modal.Content>
        <Modal.Content>
          Enter group name (optional)
          <Input focus fluid onChange={(object, data) => this.handleTextEntry(object, data, 'group')} onKeyDown={this.handleEnterSubmit} value={this.state.group} />
        </Modal.Content>
        <Modal.Content>
          Enter session number
          <Input focus fluid error={this.state.isSessionError} onChange={(object, data) => this.handleTextEntry(object, data, 'session')} onKeyDown={this.handleEnterSubmit} value={this.state.session} type="number" />
        </Modal.Content>
        <Modal.Actions>
          <Button color='blue' content='OK' onClick={this.handleClose} />
        </Modal.Actions>
      </Modal>;
  }
}