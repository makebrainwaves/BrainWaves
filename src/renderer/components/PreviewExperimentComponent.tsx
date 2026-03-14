import React, { Component } from 'react';
import { ExperimentWindow } from './ExperimentWindow';
import { getImages } from '../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../constants/interfaces';
import { EXPERIMENTS } from '../constants/constants';

interface Props {
  title: string;
  type: EXPERIMENTS;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
  isPreviewing: boolean;
  onEnd: () => void;
}

export default class PreviewExperimentComponent extends Component<Props> {
  static insertPreviewLabJsCallback(e) {
    console.log('EEG marker', e);
  }

  handleImages() {
    return getImages(this.props.params);
  }

  render() {
    if (!this.props.isPreviewing) {
      return (
        <div className="grid items-center justify-center h-full">
          <div className="p-2">The experiment will be shown in the window</div>
        </div>
      );
    }
    return (
      <div className="h-full w-full flex">
        <ExperimentWindow
          title={this.props.title}
          experimentObject={this.props.experimentObject}
          params={this.props.params}
          eventCallback={PreviewExperimentComponent.insertPreviewLabJsCallback}
          fullScreen={false}
          onFinish={this.props.onEnd}
        />
      </div>
    );
  }
}
