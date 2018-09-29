/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from "react";
import { Grid, Segment, Header, Form } from "semantic-ui-react";
import { loadFromSystemDialog } from "../../utils/filesystem/select";
import { FILE_TYPES } from "../../constants/constants";

interface Props {
  num: number;
  name: string;
  response: number;
  dir: string;
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
      nextProps.response !== this.props.response ||
      nextProps.dir !== this.props.dir
    ) {
      return true;
    }
    return false;
  }

  async handleSelectFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.STIMULUS_DIR);
    console.log(dir);
    this.props.onChange(`stim${this.props.num}Dir`, dir);
  }

  render() {
    console.log(this.props.dir);
    return (
      <Grid.Column stretched verticalAlign="middle">
        <Segment basic>
          <Header as="h1">Stimuli {this.props.num}</Header>
          <p>
            Give your stimuli group a name, select the location of your images,
            and choose the correct key response
          </p>
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
            <Grid>
              <Grid.Column width={6}>
                <Form.Button
                  secondary
                  label="Location"
                  onClick={this.handleSelectFolder}
                >
                  Select Folder
                </Form.Button>
              </Grid.Column>
              <Grid.Column verticalAlign="bottom" floated="left" width={4}>
                <Segment basic compact>
                  <em>{this.props.dir}</em>
                </Segment>
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      </Grid.Column>
    );
  }
}
