import React, { Component } from 'react';
import { Segment } from 'semantic-ui-react';
import { ExperimentWindow } from '../utils/labjs';
import styles from './styles/collect.css';

import { getImages } from '../utils/filesystem/storage';
import { Trial, ExperimentParameters } from '../constants/interfaces';

interface Props {
  title: string;
  paradigm: string;
  params: ExperimentParameters;
  previewParams?: ExperimentParameters;
  isPreviewing: boolean;
  trials: {
    [key: string]: Trial;
  };
  timelines: {};
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
          settings={{
            title: this.props.title,
            script: this.props.paradigm,
            params: this.props.previewParams || this.props.params,
            eventCallback:
              PreviewExperimentComponent.insertPreviewLabJsCallback,
            on_finish: (csv) => {
              this.props.onEnd();
            },
          }}
        />
      </div>
    );
  }
}
