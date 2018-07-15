// @flow
import React, { Component } from "react";
import { Input, Modal, Button } from "semantic-ui-react";

import { debounce } from "lodash";

interface Props {
  open: boolean;
  onClose: string => void;
  content: any;
}

interface State {
  enteredText: string;
}

export default class InputModal extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
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
          {this.props.content}
          <Input focus onChange={this.handleTextEntry} placeholder="Name" />
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
