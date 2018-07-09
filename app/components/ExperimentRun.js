// @flow
import React, { Component } from "react";
import { Grid, Button } from "semantic-ui-react";
import { Experiment } from "jspsych-react";
import { isNil } from "lodash";
import styles from "./ExperimentRun.css";
import callback_html_display from "../utils/jspsych/plugins/callback_html_display";
import callback_image_display from "../utils/jspsych/plugins/callback_image_display";
import animation from "../utils/jspsych/plugins/jspsych-animation";
import { EXPERIMENTS } from "../constants/constants";
import { parseTimeline } from "../utils/jspsych/functions";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";

type Props = {
  type: ?EXPERIMENTS,
  mainTimeline: ?MainTimeline,
  trials: ?Object<Trial>,
  timelines: ?Object<Timeline>,
  // dir: ?string,
  experimentActions: Object
};

export default class Home extends Component<Props> {
  props: Props;

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
