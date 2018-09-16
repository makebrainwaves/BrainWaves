// @flow
import React, { Component } from "react";
import { Grid, Button, Segment, Header, Input, List } from "semantic-ui-react";
import { Experiment } from "jspsych-react";
import { debounce } from "lodash";
import { Link } from "react-router-dom";
import styles from "../styles/common.css";
import { injectEmotivMarker } from "../../utils/eeg/emotiv";
import { injectMuseMarker } from "../../utils/eeg/muse";
import callbackHTMLDisplay from "../../utils/jspsych/plugins/callback-html-display";
import callbackImageDisplay from "../../utils/jspsych/plugins/callback-image-display";
import { EXPERIMENTS, DEVICES, SCREENS } from "../../constants/constants";
import {
  parseTimeline,
  instantiateTimeline,
  getImages
} from "../../utils/jspsych/functions";
import { MainTimeline, Trial } from "../../constants/interfaces";
import { readWorkspaceRawEEGData } from "../../utils/filesystem/write";

interface Props {
  type: ?EXPERIMENTS;
  title: string;
  isRunning: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
  subject: string;
  session: number;
  deviceType: DEVICES;
  experimentActions: Object;
}

export default class Run extends Component<Props> {
  props: Props;
  handleSubjectEntry: (Object, Object) => void;
  handleSessionEntry: (Object, Object) => void;
  handleStartExperiment: () => void;
  handleTimeline: () => void;

  constructor(props: Props) {
    super(props);
    this.handleSubjectEntry = debounce(this.handleSubjectEntry, 500).bind(this);
    this.handleSessionEntry = debounce(this.handleSessionEntry, 500).bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleTimeline = this.handleTimeline.bind(this);
  }

  componentDidMount() {
    if (this.props.mainTimeline.length <= 0) {
      this.props.experimentActions.loadDefaultTimeline();
    }
  }

  handleSubjectEntry(event: Object, data: Object) {
    this.props.experimentActions.setSubject(data.value);
  }

  handleSessionEntry(event: Object, data: Object) {
    this.props.experimentActions.setSession(parseFloat(data.value));
  }

  handleStartExperiment() {
    this.props.experimentActions.start();
  }

  handleTimeline() {
    const injectionFunction =
      this.props.deviceType === "MUSE" ? injectMuseMarker : injectEmotivMarker;

    const timeline = instantiateTimeline(
      parseTimeline(
        this.props.mainTimeline,
        this.props.trials,
        this.props.timelines
      ),
      (value, time) => injectionFunction(value, time), // event callback
      null, // start callback
      this.props.experimentActions.stop // stop callback
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

  renderExperiment() {
    if (!this.props.isRunning) {
      return (
        <div>
          <Segment raised padded color="red">
            {this.props.title}
            <div className={styles.inputDiv}>
              <Input
                focus
                label={{ basic: true, content: "Subject Name" }}
                onChange={this.handleSubjectEntry}
                placeholder="Name"
              />
            </div>
            <div className={styles.inputDiv}>
              <Input
                focus
                label={{ basic: true, content: "Session Number" }}
                onChange={this.handleSessionEntry}
                placeholder={this.props.session}
              />
            </div>
            <Button onClick={this.handleStartExperiment}>
              Start Experiment
            </Button>
          </Segment>
          <Link to={SCREENS.CLEAN.route}>
            <Button>Clean Data</Button>
          </Link>
        </div>
      );
    }
    return (
      <Experiment
        settings={{
          timeline: this.handleTimeline(),
          show_progress_bar: true,
          auto_update_progress_bar: false,
          on_finish: this.props.experimentActions.stop,
          preload_images: this.handleImages()
        }}
        plugins={{
          "callback-image-display": callbackImageDisplay,
          "callback-html-display": callbackHTMLDisplay
        }}
      />
    );
  }

  render() {
    return (
      <div>
        <div className={styles.mainContainer} data-tid="container">
          <Grid columns={1} divided relaxed>
            <Grid.Row centered>{this.renderExperiment()}</Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
