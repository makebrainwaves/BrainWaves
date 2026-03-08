import React, { Component } from 'react';
import {
  richestMimetype,
  standardDisplayOrder,
  standardTransforms,
} from '@nteract/transforms';
import { isNil } from 'lodash';
import { storePyodideImage } from '../utils/filesystem/storage';

interface Props {
  title: string;
  imageTitle: string;
  plotMIMEBundle:
    | {
        [key: string]: string;
      }
    | null
    | undefined;
}

interface State {
  rawData: string;
  mimeType: string;
}

export default class PyodidePlotWidget extends Component<Props, State> {
  // state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      rawData: '',
      mimeType: '',
    };
    this.handleSave = this.handleSave.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.plotMIMEBundle !== prevProps.plotMIMEBundle &&
      !isNil(this.props.plotMIMEBundle)
    ) {
      const bundle = this.props.plotMIMEBundle as { [key: string]: string };
      const mimeType = richestMimetype(
        bundle,
        standardDisplayOrder,
        standardTransforms
      );
      if (mimeType) {
        this.setState({ rawData: bundle[mimeType], mimeType });
      }
    }
  }

  handleSave() {
    const buf = Buffer.from(this.state.rawData, 'base64');
    storePyodideImage(this.props.title, this.props.imageTitle, buf.buffer as ArrayBuffer);
  }

  renderResults() {
    if (this.state.rawData) {
      const Transform = standardTransforms[this.state.mimeType];
      return <Transform data={this.state.rawData} />;
    }
  }

  renderSaveButton() {
    if (this.state.rawData) {
      return (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors font-medium text-sm"
          onClick={this.handleSave}
        >
          Save Image
        </button>
      );
    }
  }

  render() {
    return (
      <div className="p-0">
        {this.renderResults()}
        {this.renderSaveButton()}
      </div>
    );
  }
}
