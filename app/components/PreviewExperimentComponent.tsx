import React, { Component } from 'react';
import { Segment } from 'semantic-ui-react';
import { ExperimentWindow } from './ExperimentWindow';
import styles from './styles/collect.css';

import { getImages } from '../utils/filesystem/storage';
import { ExperimentParameters } from '../constants/interfaces';
import { EXPERIMENTS } from '../constants/constants';

interface Props {
  title: string;
  type: EXPERIMENTS;
  studyObject: any;
  params: ExperimentParameters;
  previewParams?: ExperimentParameters;
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
        <div className={styles.previewPlaceholder}>
          <Segment basic> The experiment will be shown in the window </Segment>
        </div>
      );
    }
    return (
      <div className={styles.previewExpComponent}>
        <ExperimentWindow
          title={this.props.title}
          type={this.props.type}
          studyObject={this.props.studyObject}
          params={this.props.previewParams || this.props.params}
          eventCallback={PreviewExperimentComponent.insertPreviewLabJsCallback}
          onFinish={(csv) => {
            this.props.onEnd();
          }}
        />
      </div>
    );
  }
}
