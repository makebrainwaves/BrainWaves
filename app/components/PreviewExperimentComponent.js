// @flow
import React, { Component } from 'react';
import { Segment } from 'semantic-ui-react';
import { ExperimentWindow } from '../utils/labjs';
import styles from './styles/collect.css';

import { getImages } from '../utils/filesystem/storage';
import { MainTimeline, Trial, ExperimentParameters } from '../constants/interfaces';

interface Props {
  params: ExperimentParameters;
  isPreviewing: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
}

export default class PreviewExperimentComponent extends Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
  }

  handleImages() {
    return getImages(this.props.params);
  }

  insertPreviewLabJsCallback(e) {
    console.log('EEG marker', e);
  }

  render() {
    if (!this.props.isPreviewing) {
      return (
        <div className={styles.previewPlaceholder}>
          <Segment basic> The experiment will be shown in the window </Segment>
        </div>
        )
    }
    return (
      <div className={styles.previewExpComponent}>
        <ExperimentWindow
          settings={{
            title: this.props.title,
            script: this.props.paradigm,
            params: this.props.previewParams || this.props.params,
            eventCallback: this.insertPreviewLabJsCallback,
            on_finish: (csv) => {
              this.props.onEnd();
            },
          }}
        />
      </div>
    );
  }
}
