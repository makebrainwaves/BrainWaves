// @flow
import React, { Component } from 'react';
import { Experiment } from 'jspsych-react';
import { Segment } from 'semantic-ui-react';
import callbackHTMLDisplay from '../utils/jspsych/plugins/callback-html-display';
import callbackImageDisplay from '../utils/jspsych/plugins/callback-image-display';
import { ExperimentWindow } from '../utils/labjs';

import {
  parseTimeline,
  instantiateTimeline,
  getImages
} from '../utils/jspsych/functions';
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../constants/interfaces';

interface Props {
  params: ExperimentParameters;
  isPreviewing: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
}

export default class PreviewExperimentComponent extends Component<Props> {
  props: Props;
  handleTimeline: () => void;

  constructor(props: Props) {
    super(props);
    this.handleTimeline = this.handleTimeline.bind(this);
  }

  handleTimeline() {
    const timeline = instantiateTimeline(
      parseTimeline(
        this.props.params,
        this.props.mainTimeline,
        this.props.trials,
        this.props.timelines
      ),
      (value, time) => {}, // event callback
      () => {}, // start callback
      () => {}, // stop callback
      this.props.params.showProgessBar
    );
    return timeline;
  }

  handleImages() {
    return getImages(this.props.params);
  }

  // This function could be used in the future in order to load custom pre-coded jspsych experiments
  // async handleCustomExperimentLoad() {
  //   const timelinePath = await loadFromSystemDialog(FILE_TYPES.TIMELINE);
  // }

  render() {
    if (!this.props.isPreviewing) {
      return <Segment basic />;
    }
    return (
      <ExperimentWindow
      settings={{
          script: this.props.type,
          on_finish: (csv) => {
            this.props.onEnd()
          }
        }} />
    );
  }
}
