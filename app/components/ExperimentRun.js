// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button, Segment } from "semantic-ui-react";
import { jsPsych, Experiment } from "jspsych-react";
import { isNil } from "lodash";
import { timelineFactory } from "../utils/timeline";
import callback_html_display from "../utils/plugins/callback_html_display";
import callback_image_display from "../utils/plugins/callback_image_display";
import { EXPERIMENTS } from "../constants/constants";

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
    return (
      <Experiment
        timeline={timelineFactory(this.props.type, targetID =>
          console.log(targetID)
        )}
        plugins={{
          callback_image_display,
          callback_html_display
        }}
      />
    );
  }

  render() {
    return (
      <div>
        <div data-tid="container">
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
