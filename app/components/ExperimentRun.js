// @flow
import React, { Component } from "react";
import { Grid, Button, Icon } from "semantic-ui-react";
import { Experiment } from "jspsych-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./ExperimentRun.css";
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
  }

  handleClose(subjectName: string) {
    this.setState({ isInputModalVisible: false });
    this.props.experimentActions.setSubject(subjectName);
    this.props.experimentActions.start();
  }

  startExperiment(experiment: EXPERIMENTS) {
    this.props.experimentActions.setType(experiment);
    if (this.props.subject === "") {
      this.setState({ isInputModalVisible: true });
    } else {
      this.props.experimentActions.start();
    }
  }

  renderExperiment(experimentType: ?EXPERIMENTS) {
    if (!this.props.isRunning) {
      return (
        <div>
          <Button onClick={() => this.startExperiment(EXPERIMENTS.P300)}>
            P300
          </Button>
          <Button onClick={() => this.startExperiment(EXPERIMENTS.SSVEP)}>
            SSVEP
          </Button>
          <Button onClick={() => this.startExperiment(EXPERIMENTS.N170)}>
            N170
          </Button>
          <Button onClick={() => this.startExperiment(EXPERIMENTS.STROOP)}>
            Stroop
          </Button>
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
        <Link to="/">
          <Icon name="arrow circle left" size="huge" inverted />
        </Link>
        <div className={styles.experimentContainer} data-tid="container">
          <Grid columns={1} divided relaxed>
            <Grid.Row centered>
              {this.renderExperiment(this.props.type)}
            </Grid.Row>
          </Grid>
        </div>
        <InputModal
          open={this.state.isInputModalVisible}
          onClose={subjectName => this.handleClose(subjectName)}
          content={<h3>Please enter the experimental subject&#039;s name</h3>}
        />
      </div>
    );
  }
}
