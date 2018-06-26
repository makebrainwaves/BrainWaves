// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button } from "semantic-ui-react";
import styles from "./Home.css";
import { createStream as createMuseStream } from "../utils/muse";
import { Observable } from "rxjs";
import { jsPsych, Experiment } from "jspsych-react";

type Props = {
  jupyterActions: Object,
  deviceActions: Object,
  rawObservable: ?any
};

export default class Home extends Component<Props> {
  props: Props;

  componentDidMount(){

  }

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <h2>Home</h2>
          <Link to="/counter">to Counter</Link>
          <Grid columns={2} divided relaxed>
            <Grid.Column>
              <Button onClick={this.props.jupyterActions.launchKernel}>
                Launch Kernel
              </Button>
              <Button
                onClick={() => this.props.jupyterActions.requestKernelInfo()}
              >
                Request Kernel Info
              </Button>
              <Button
                onClick={() =>
                  this.props.jupyterActions.sendExecuteRequest("print(2+2)")
                }
              >
                Print 2+2
              </Button>
              <Button onClick={() => this.props.jupyterActions.closeKernel()}>
                Close Kernel
              </Button>
            </Grid.Column>
            <Grid.Column>
              <Button onClick={() => this.props.deviceActions.initEmotiv()}>
                Init Emotiv
              </Button>
              <Button onClick={() => this.props.deviceActions.initMuse()}>
                Init Muse
              </Button>
              <Button
                onClick={() => this.props.rawObservable.subscribe(console.log)}
              >
                Subscribe to Stream
              </Button>
            </Grid.Column>
            <Experiment></Experiment>
          </Grid>
        </div>
      </div>
    );
  }
}
