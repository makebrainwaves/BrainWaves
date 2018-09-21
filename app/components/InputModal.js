// @flow
import React, { Component } from "react";
import { Input, Modal, Button } from "semantic-ui-react";
import { debounce } from "lodash";
import styles from "./styles/collect.css";

interface Props {
  open: boolean;
  onClose: string => void;
  placeholder: string;
  header: string;
}

interface State {
  enteredText: string;
}

export default class InputModal extends Component<Props, State> {
  props: Props;
  state: State;
  handleTextEntry: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      enteredText: ""
    };
    this.handleTextEntry = debounce(this.handleTextEntry, 500).bind(this);
  }

  handleTextEntry(event, data) {
    this.setState({ enteredText: data.value });
  }

  render() {
    return (
      <Modal
        basic
        centered
        className={styles.connectModal}
        open={this.props.open}
        onClose={() => this.props.onClose(this.state.enteredText)}
      >
        <Modal.Content className={styles.searchingText}>
          {this.props.header}
        </Modal.Content>
        <Modal.Content>
          <Input
            focus
            fluid
            onChange={this.handleTextEntry}
            placeholder={this.props.placeholder}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            color="blue"
            content="OK"
            onClick={() => this.props.onClose(this.state.enteredText)}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
