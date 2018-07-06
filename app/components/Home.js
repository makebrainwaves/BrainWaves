// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button, Segment } from "semantic-ui-react";
import styles from "./Home.css";
import { createStream as createMuseStream } from "../utils/muse";
import { Observable } from "rxjs";

type Props = {
  jupyterActions: Object,
  deviceActions: Object,
  rawObservable: ?any
};

export default class Home extends Component<Props> {
  props: Props;
  state: {
    eegData: Array<number>
  };
  constructor(props: Object) {
    super(props);
    this.state = {
      eegData: []
    };
  }

  componentDidMount() {}

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <Grid columns={1} divided relaxed>
            <Grid.Row>
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
                  onClick={() =>
                    this.props.rawObservable.subscribe(eeg =>
                      this.setState({ eegData: eeg.data })
                    )
                  }
                >
                  Subscribe to Stream
                </Button>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row centered>
              <p>{this.state.eegData.join(",  ")}</p>
            </Grid.Row>
            <Grid.Row centered>
              <Link to={"experimentRun"}>
                <Button>Run Experiment</Button>
              </Link>
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
