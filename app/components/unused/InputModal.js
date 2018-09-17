// @flow
import React, { Component } from "react";
import { Input, Modal, Button } from "semantic-ui-react";
import { debounce } from "lodash";

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
        open={this.props.open}
        onClose={() => this.props.onClose(this.state.enteredText)}
        basic
        dimmer="blurring"
        size="small"
      >
        <Modal.Content>
          <Modal.Header as="h1">{this.props.header}</Modal.Header>
          <Input
            focus
            fluid
            onChange={this.handleTextEntry}
            placeholder={this.props.placeholder}
          />
        </Modal.Content>
        {/* <Input focus placeholder="Name.." /> */}
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
