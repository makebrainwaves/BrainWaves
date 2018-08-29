// @flow
import React, { Component } from "react";
import { Experiment, jsPsych } from "jspsych-react";
import { Grid, Button } from "semantic-ui-react";
import callbackHTMLDisplay from "../../utils/jspsych/plugins/callback-html-display";
import callbackImageDisplay from "../../utils/jspsych/plugins/callback-image-display";
import { FILE_TYPES } from "../../constants/constants";
import {
  parseTimeline,
  instantiateTimeline
} from "../../utils/jspsych/functions";
import { loadFileFromSystemDialog } from "../../utils/filesystem/select";
import { MainTimeline, Trial, Timeline } from "../../constants/interfaces";

interface Props {
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
}

interface State {
  isRunning: false;
}

export default class PreviewExperimentComponent extends Component<
  Props,
  State
> {
  props: Props;
  handleTimeline: () => void;

  constructor(props) {
    super(props);
    this.state = { isRunning: false };
    this.handleTimeline = this.handleTimeline.bind(this);
  }

  handleTimeline() {
    const timeline = instantiateTimeline(
      parseTimeline(
        this.props.mainTimeline,
        this.props.trials,
        this.props.timelines
      ),
      (value, time) => console.log("event ", value), // event callback
      () => this.setState({ isRunning: true }), // start callback
      () => this.setState({ isRunning: false }) // stop callback
    );
    console.log("timeline: ", timeline);
    return timeline;
  }

  async handleCustomExperimentLoad() {
    const timelinePath = await loadFileFromSystemDialog(FILE_TYPES.TIMELINE);
    console.log(timelinePath);
  }

  renderExperiment() {
    if (this.state.isRunning) {
      return (
        <Experiment
          settings={{
            timeline: this.handleTimeline(),
            show_progress_bar: true,
            auto_update_progress_bar: false
          }}
          plugins={{
            "callback-image-display": callbackImageDisplay,
            "callback-html-display": callbackHTMLDisplay
          }}
        />
      );
    }
  }

  render() {
    return (
      <Grid columns={1} divided relaxed>
        <Grid.Row centered>{this.renderExperiment()}</Grid.Row>
        <Grid.Row centered>
          <Button positive onClick={() => this.setState({ isRunning: true })}>
            Start
          </Button>
          <Button negative onClick={() => this.setState({ isRunning: false })}>
            Stop
          </Button>
          <Button basic onClick={this.handleCustomExperimentLoad}>
            Load Custom Experiment
          </Button>
        </Grid.Row>
      </Grid>
    );
  }
}
