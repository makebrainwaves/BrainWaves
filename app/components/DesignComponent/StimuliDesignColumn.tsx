/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from 'react';
import { Form, Button, Table, Icon } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import * as path from 'path';
import { readImages } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { FILE_TYPES } from '../../constants/constants';
import styles from '../styles/common.css';

interface Props {
  num: number;
  title: string;
  response: string;
  dir: string;
  onChange: (arg0: string, arg1: string) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString(),
}));

export default class StimuliDesignColumn extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handleSelectFolder = this.handleSelectFolder.bind(this);
    this.handleRemoveFolder = this.handleRemoveFolder.bind(this);
    this.state = {
      numberImages: undefined,
    };
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
    if (dir) {
      const images = readImages(dir);
      if (images.length < 1) {
        toast.error('No images in folder!');
      }
      this.setState({
        numberImages: images.length,
      });
      this.props.onChange('dir', dir, `stimulus${this.props.num}`);
    }
  }

  handleRemoveFolder() {
    this.setState({
      numberImages: 0,
    });
    this.props.onChange('dir', '', `stimulus${this.props.num}`);
  }

  render() {
    return (
      <Table.Row className={styles.conditionRow}>
        <Table.Cell className={styles.conditionsNameRow}>
          {this.props.num}
          <Form>
            <Form.Input
              value={this.props.title}
              onChange={(event, data) =>
                this.props.onChange(
                  'title',
                  data.value,
                  `stimulus${this.props.num}`
                )
              }
              placeholder="Enter condition name"
            />
          </Form>
        </Table.Cell>

        <Table.Cell className={styles.experimentRowName}>
          <Form.Select
            fluid
            selection
            value={this.props.response}
            onChange={(event, data) =>
              this.props.onChange(
                'response',
                data.value,
                `stimulus${this.props.num}`
              )
            }
            placeholder="Select"
            options={RESPONSE_OPTIONS}
          />
        </Table.Cell>

        <Table.Cell className={styles.experimentRowName}>
          {this.props.dir ? (
            <div className={styles.selectedFolderContainer}>
              <div>
                Folder{' '}
                {this.props.dir &&
                  this.props.dir.split(path.sep).slice(-1).join(' / ')}
              </div>
              <div>
                ( {this.state.numberImages || this.props.numberImages} images ){' '}
              </div>
              <div>
                <Icon name="delete" onClick={this.handleRemoveFolder} />
              </div>
            </div>
          ) : (
            <Button secondary onClick={this.handleSelectFolder}>
              Select folder
            </Button>
          )}
        </Table.Cell>
      </Table.Row>
    );
  }
}
