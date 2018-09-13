// @flow
import React, { Component } from "react";
import { Experiment } from "jspsych-react";
import { Segment } from "semantic-ui-react";
import callbackHTMLDisplay from "../utils/jspsych/plugins/callback-html-display";
import callbackImageDisplay from "../utils/jspsych/plugins/callback-image-display";
import {
  parseTimeline,
  instantiateTimeline,
  getImages
} from "../utils/jspsych/functions";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";

interface Props {
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
        this.props.mainTimeline,
        this.props.trials,
        this.props.timelines
      ),
      (value, time) => console.log("event ", value, time), // event callback
      () => {}, // start callback
      () => {} // stop callback
    );
    return timeline;
  }

  handleImages() {
    return getImages(
      this.props.mainTimeline,
      this.props.trials,
      this.props.timelines
    );
  }

  // async handleCustomExperimentLoad() {
  //   const timelinePath = await loadFileFromSystemDialog(FILE_TYPES.TIMELINE);
  // }

  render() {
    if (!this.props.isPreviewing) {
      return <Segment basic />;
    }
    return (
      <Experiment
        settings={{
          timeline: this.handleTimeline(),
          show_progress_bar: true,
          auto_update_progress_bar: false,
          preload_images: this.handleImages()
        }}
        plugins={{
          "callback-image-display": callbackImageDisplay,
          "callback-html-display": callbackHTMLDisplay
        }}
      />
    );
  }
}
