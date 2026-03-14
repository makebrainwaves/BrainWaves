/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from 'react';
import { Button } from '../ui/button';
import { TableRow, TableCell } from '../ui/table';
import { toast } from 'react-toastify';
import path from 'pathe';
import { isString } from 'lodash';
import { readImages } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { FILE_TYPES } from '../../constants/constants';

interface Props {
  num: number;
  title: string;
  response: string;
  dir: string;
  numberImages?: number;
  onChange: (arg0: string, arg1: string, arg2: string) => void;
}

interface State {
  numberImages?: number;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString(),
}));

export default class StimuliDesignColumn extends Component<Props, State> {
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
    if (dir && isString(dir)) {
      const images = await readImages(dir);
      if (images.length < 1) {
        toast.error('No images in folder!');
      }
      this.setState({ numberImages: images.length });
      this.props.onChange('dir', dir, `stimulus${this.props.num}`);
    }
  }

  handleRemoveFolder() {
    this.setState({ numberImages: 0 });
    this.props.onChange('dir', '', `stimulus${this.props.num}`);
  }

  render() {
    return (
      <TableRow>
        <TableCell className="pl-[60px]">
          <div className="grid grid-cols-[50px_1fr] items-center gap-2">
            <span>{this.props.num}</span>
            <input
              className="border border-gray-300 rounded px-2 py-1 w-full"
              value={this.props.title}
              onChange={(event) =>
                this.props.onChange(
                  'title',
                  event.target.value,
                  `stimulus${this.props.num}`
                )
              }
              placeholder="Enter condition name"
            />
          </div>
        </TableCell>

        <TableCell className="pl-6 pr-2.5">
          <select
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={this.props.response}
            onChange={(event) => {
              const val = event.target.value;
              if (val && isString(val)) {
                this.props.onChange(
                  'response',
                  val,
                  `stimulus${this.props.num}`
                );
              }
            }}
          >
            <option value="">Select</option>
            {RESPONSE_OPTIONS.map((o) => (
              <option key={o.key} value={o.value}>
                {o.text}
              </option>
            ))}
          </select>
        </TableCell>

        <TableCell className="pl-6 pr-2.5">
          {this.props.dir ? (
            <div className="inline-grid grid-cols-[auto_auto_1fr] gap-2.5 border-2 border-gray-300 p-2 rounded w-fit items-center">
              <div>
                Folder{' '}
                {this.props.dir &&
                  this.props.dir.split(path.sep).slice(-1).join(' / ')}
              </div>
              <div>
                ( {this.state.numberImages || this.props.numberImages} images )
              </div>
              <button onClick={this.handleRemoveFolder} aria-label="Remove">
                ✕
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={this.handleSelectFolder}>
              Select folder
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }
}
