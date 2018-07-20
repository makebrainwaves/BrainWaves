// @flow
import React, { Component } from "react";
import { Input, Card, Button } from "semantic-ui-react";
import { debounce, isNil } from "lodash";
import { executeRequest } from "@nteract/messaging";
import {
  richestMimetype,
  standardDisplayOrder,
  standardTransforms
} from "@nteract/transforms";

interface Props {
  mainChannel: ?any;
  defaultCell: string;
  header: string;
}

interface State {
  cellText: string;
  imageResult: ?{ [string]: string };
  isBusy: boolean;
}

export default class JupyterPlotWidget extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      cellText: props.defaultCell,
      imageResult: null,
      isBusy: false
    };
    this.handleTextEntry = debounce(this.handleTextEntry, 300).bind(this);
    this.handleExecuteReturn = this.handleExecuteReturn.bind(this);
  }

  handleTextEntry(event, data) {
    this.setState({ cellText: data.value });
  }

  executeCell(cell) {
    this.props.mainChannel.subscribe(this.handleExecuteReturn);
    this.props.mainChannel.next(executeRequest(cell));
  }

  handleExecuteReturn(msg) {
    if (!isNil(msg.execution_state) && msg.execution_state === "busy") {
      this.setState({ isBusy: true });
    }
    if (!isNil(msg.content)) {
      // Images
      if (!isNil(msg.content.data)) {
        this.setState({ imageResult: msg.content.data });
      }
    }
  }

  renderResults() {
    if (!isNil(this.state.imageResult)) {
      const mimeType = richestMimetype(
        this.state.imageResult,
        standardDisplayOrder,
        standardTransforms
      );
      const Transform = standardTransforms[mimeType];
      return <Transform data={this.state.imageResult[mimeType]} />;
    }
  }

  render() {
    return (
      <Card>
        {this.renderResults()}
        <Card.Content>
          <Card.Header>{this.props.header}</Card.Header>
          <Card.Content extra>
            <Input
              focus
              onChange={this.handleTextEntry}
              defaultValue={this.props.defaultCell}
            />
            <Button
              loading={this.state.isBusy}
              color="blue"
              content="Execute"
              onClick={() => this.executeCell(this.state.cellText)}
            />
          </Card.Content>
        </Card.Content>
      </Card>
    );
  }
}
