/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from "react";
import { Grid, Segment, Header, Form } from "semantic-ui-react";

interface Props {
  num: number;
  name: string;
  response: number;
  onChange: (string, string) => void;
}

const RESPONSE_OPTIONS = new Array(10)
  .fill(0)
  .map((_, i) => ({ key: i, text: i, value: i }));

export default class StimuliDesignColumn extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handleSelectFolder = this.handleSelectFolder.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.name !== this.props.name ||
      nextProps.response !== this.props.response
    ) {
      return true;
    }
    return false;
  }

  handleSelectFolder() {}

  render() {
    return (
      <Grid.Column stretched verticalAlign="middle">
        <Segment as="p" basic>
          <Header as="h1">Stimuli {this.props.num}</Header>
          Give your stimuli group a name, select the location of your images,
          and choose the correct key response
        </Segment>
        <Segment basic>
          <Form>
            <Form.Group>
              <Form.Input
                width={10}
                label="Name"
                value={this.props.name}
                onChange={(event, data) =>
                  this.props.onChange(`stim${this.props.num}Name`, data.value)
                }
                placeholder="e.g. Faces"
              />
              <Form.Dropdown
                selection
                width={4}
                label="Correct Response"
                value={this.props.response}
                onChange={(event, data) =>
                  this.props.onChange(
                    `stim${this.props.num}Response`,
                    data.value
                  )
                }
                placeholder="Response"
                options={RESPONSE_OPTIONS}
              />
            </Form.Group>
            <Form.Button
              secondary
              label="Location"
              onClick={() => this.handleSelectFolder(1)}
            >
              Select Folder
            </Form.Button>
          </Form>
        </Segment>
      </Grid.Column>
    );
  }
}
