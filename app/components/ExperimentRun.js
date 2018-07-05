// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button, Segment } from "semantic-ui-react";
import { jsPsych, Experiment } from "jspsych-react";
import { timelineFactory } from "../utils/timeline";
import callback_html_display from "../utils/plugins/callback_html_display";
import callback_image_display from "../utils/plugins/callback_image_display";
import { EXPERIMENTS } from "../constants/constants";

type Props = {
  type: ?EXPERIMENTS,
  dir: ?string
};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props: Object) {
    super(props);
  }

  componentDidMount() {}

  render() {
    return (
      <div>
        <div data-tid="container">
          <Grid columns={1} divided relaxed>
            <Grid.Row centered>
              <Experiment
                timeline={timelineFactory(targetID => console.log(targetID))}
                plugins={{
                  callback_image_display,
                  callback_html_display
                }}
              />
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
