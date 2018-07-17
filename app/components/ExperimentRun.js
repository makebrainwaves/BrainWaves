// @flow
import React, { Component } from "react";
import { Grid, Button, Icon, Segment, Header, Input } from "semantic-ui-react";
import { Experiment } from "jspsych-react";
import { Link } from "react-router-dom";
import styles from "./ExperimentRun.css";
import { debounce, isNil } from "lodash";
import callback_html_display from "../utils/jspsych/plugins/callback_html_display";
import callback_image_display from "../utils/jspsych/plugins/callback_image_display";
import animation from "../utils/jspsych/plugins/jspsych-animation";
import { EXPERIMENTS } from "../constants/constants";
import { parseTimeline } from "../utils/jspsych/functions";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";
import InputModal from "./InputModal";

interface Props {
  type: ?EXPERIMENTS;
  isRunning: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  // dir: ?string,
  subject: string;
  session: number;
  experimentActions: Object;
}

interface State {
  isInputModalVisible: boolean;
}

export default class ExperimentRun extends Component<Props> {
  props: Props;
  state: State;
  constructor(props) {
    super(props);
    this.state = {
      isInputModalVisible: false
    };
    this.handleSubjectEntry = debounce(this.handleSubjectEntry, 500).bind(this);
    this.handleSessionEntry = debounce(this.handleSessionEntry, 500).bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
  }

  componentDidMount() {
    this.props.experimentActions.loadDefaultTimeline();
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

  renderExperiment(experimentType: ?EXPERIMENTS) {
    if (!this.props.isRunning) {
      return (
        <div>
          <Segment raised padded color="purple">
            <Header as="h3">Faces and Houses N170 Experiment</Header>
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
                placeholder="0"
              />
            </div>
            <Button onClick={this.handleStartExperiment}>
              Start Experiment
            </Button>
          </Segment>
        </div>
      );
    }
    return (
      <Experiment
        timeline={parseTimeline(
          this.props.mainTimeline,
          this.props.trials,
          this.props.timelines
        )}
        plugins={{
          callback_image_display,
          callback_html_display,
          animation
        }}
      />
    );
  }

  render() {
    return (
      <div>
        <div className={styles.experimentContainer} data-tid="container">
          <Link to="/" className={styles.homeButton}>
            <Icon name="home" size="large" color="black" inverted />
          </Link>
          <Grid columns={1} divided relaxed>
            <Grid.Row centered>
              {this.renderExperiment(this.props.type)}
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
