/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from 'react';
import { Grid, Segment, Header, Form } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import { readImages } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { FILE_TYPES } from '../../constants/constants';

interface Props {
  num: number;
  title: string;
  response: string;
  dir: string;
  onChange: (string, string) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString()
}));

export default class StimuliDesignColumn extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handleSelectFolder = this.handleSelectFolder.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.title !== this.props.title ||
      nextProps.response !== this.props.response ||
      nextProps.dir !== this.props.dir
    ) {
      return true;
    }
    return false;
  }

  async handleSelectFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.STIMULUS_DIR);
    const images = readImages(dir);

    if (images.length < 1) {
      toast.error('No images in folder!');
    }
    this.props.onChange('dir', dir);
  }

  render() {
    return (
      <Grid.Column stretched verticalAlign="middle">
        <Segment basic>
          <Header as="h1">Condition {this.props.num}</Header>
          <p>
            Give your condition a title, select the location of your images, and
            choose the correct key response
          </p>
        </Segment>
        <Segment basic>
          <Form>
            <Form.Group>
              <Form.Input
                width={10}
                label="Title"
                value={this.props.title}
                onChange={(event, data) =>
                  this.props.onChange('title', data.value)
                }
                placeholder="e.g. Faces"
              />
              <Form.Dropdown
                selection
                width={4}
                label="Correct Response"
                value={this.props.response}
                onChange={(event, data) =>
                  this.props.onChange('response', data.value)
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
                  <em>
                    {// Kind of hacky. Set to empty string if dir is inside app itself (default images)
                    this.props.dir.includes('app') ? '' : this.props.dir}
                  </em>
                </Segment>
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      </Grid.Column>
    );
  }
}
