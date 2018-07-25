// @flow
import React, { Component } from "react";
import { Grid, Button, Segment, Header, Input, List } from "semantic-ui-react";
import { Experiment } from "jspsych-react";
import { debounce } from "lodash";
import { Link } from "react-router-dom";
import styles from "./styles/common.css";
import callbackHtmlDisplay from "../utils/jspsych/plugins/callback-html-display";
import callbackImageDisplay from "../utils/jspsych/plugins/callback-image-display";
import animation from "../utils/jspsych/plugins/jspsych-animation";
import { injectEmotivMarker } from "../utils/emotiv";
import { injectMuseMarker } from "../utils/muse";
import { EXPERIMENTS, DEVICES } from "../constants/constants";
import { parseTimeline, instantiateTimeline } from "../utils/jspsych/functions";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";
import {
  readEEGDataDir,
  getCurrentEEGDataDir
} from "../utils/filesystem/write";

interface Props {
  type: ?EXPERIMENTS;
  isRunning: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  // dir: ?string,
  subject: string;
  session: number;
  deviceType: DEVICES;
  client: ?any;
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
      value =>
        injectionFunction(this.props.client, value, new Date().getTime()),
      null,
      this.props.experimentActions.stop
    );
    console.log("timeline: ", timeline);
    console.log("plugin: ", callbackHtmlDisplay);
    return timeline;
  }

  renderTrialList() {
    return (
      <div>
        <List as="ul">
          {readEEGDataDir(this.props.type).map(filename => (
            <List.Item
              icon="file"
              key={filename.name}
              description={filename.name}
            />
          ))}
        </List>
      </div>
    );
  }

  renderExperimentTitle() {
    switch (this.props.type) {
      case EXPERIMENTS.N170:
        return <Header as="h3">Faces and Houses N170 Experiment</Header>;
      case EXPERIMENTS.P300:
        return <Header as="h3">Visual Oddball P300 Experiment</Header>;
      case EXPERIMENTS.SSVEP:
        return (
          <Header as="h3">
            Steady-State Visual Evoked Potential Experiment
          </Header>
        );
      case EXPERIMENTS.STROOP:
        return <Header as="h3">Stroop Experiment</Header>;

      case EXPERIMENTS.NONE:
      default:
        return <Header as="h3">No experiment selected</Header>;
    }
  }

  renderExperiment() {
    if (!this.props.isRunning) {
      return (
        <div>
          <Segment raised padded color="red">
            {this.renderExperimentTitle()}
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
          <Segment raised padded color="red">
            <Header as="h3">
              Collected Trials
              <Header.Subheader>
                {getCurrentEEGDataDir(this.props.type)}
              </Header.Subheader>
            </Header>
            {this.renderTrialList()}
          </Segment>
          <Link to="/analyze">
            <Button>Analyze Data</Button>
          </Link>
        </div>
      );
    }
    return (
      <Experiment
        timeline={this.handleTimeline()}
        plugins={{
          "callback-image-display": callbackImageDisplay,
          "callback-html-display": callbackHtmlDisplay,
          animation
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
