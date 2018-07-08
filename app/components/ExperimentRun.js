// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button, Segment } from "semantic-ui-react";
import { jsPsych, Experiment } from "jspsych-react";
import { isNil } from "lodash";
import styles from "./ExperimentRun.css";
import { parseTimeline } from "../utils/jspsych/functions";
import callback_html_display from "../utils/jspsych/plugins/callback_html_display";
import callback_image_display from "../utils/jspsych/plugins/callback_image_display";
import animation  from "../utils/jspsych/plugins/jspsych-animation";
import { EXPERIMENTS } from "../constants/constants";
import { oddballTimeline } from "../utils/jspsych/timelines/oddball";
import { n170Timeline } from "../utils/jspsych/timelines/n170";
import { ssvepTimeline } from "../utils/jspsych/timelines/ssvep";

type Props = {
  type: ?EXPERIMENTS,
  dir: ?string,
  experimentActions: Object
};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props: Object) {
    super(props);
  }

  renderExperiment(experimentType: ?EXPERIMENTS) {
    if (isNil(experimentType)) {
      return (
        <div>
          <Button
            onClick={() =>
              this.props.experimentActions.setType(EXPERIMENTS.P300)
            }
          >
            P300
          </Button>
          <Button
            onClick={() =>
              this.props.experimentActions.setType(EXPERIMENTS.SSVEP)
            }
          >
            SSVEP
          </Button>
          <Button
            onClick={() =>
              this.props.experimentActions.setType(EXPERIMENTS.N170)
            }
          >
            N170
          </Button>
          <Button
            onClick={() =>
              this.props.experimentActions.setType(EXPERIMENTS.STROOP)
            }
          >
            Stroop
          </Button>
        </div>
      );
    }
    let timeline;
    switch (experimentType) {
      case EXPERIMENTS.P300:
        timeline = oddballTimeline;
        break;
      case EXPERIMENTS.N170:
        timeline = n170Timeline;
        break;
        case EXPERIMENTS.SSVEP:
        timeline = ssvepTimeline;
        break;
      default:
        timeline = oddballTimeline;
    }
    return (
      <Experiment
        timeline={parseTimeline(timeline)}
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
