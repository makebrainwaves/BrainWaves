// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button } from "semantic-ui-react";
import styles from "./Home.css";
import { injectMarker } from "../utils/emotiv";
import {
  imports,
  loadCSV,
  plotERP,
  filterIIR,
  plotPSD
} from "../utils/jupyter/cells";
import  JupyterPlotWidget from "./JupyterPlotWidget";

interface Props {
  jupyterActions: Object;
  deviceActions: Object;
  rawObservable: ?any;
  client: ?any;
  mainChannel: ?any;
}

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
                    this.props.jupyterActions.sendExecuteRequest(imports())
                  }
                >
                  Imports
                </Button>
                <Button
                  onClick={() =>
                    this.props.jupyterActions.sendExecuteRequest(
                      loadCSV(
                        "Dano",
                        0,
                        "../",
                        128.0,
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                        14
                      )
                    )
                  }
                >
                  Load CSV
                </Button>
                <Button
                  onClick={() =>
                    this.props.jupyterActions.sendExecuteRequest(
                      filterIIR(1, 30)
                    )
                  }
                >
                  Filter
                </Button>
                <Button
                  onClick={() =>
                    this.props.jupyterActions.sendExecuteRequest(plotPSD())
                  }
                >
                  Plot PSD
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
                    this.props.rawObservable.subscribe(eeg => console.log(eeg))
                  }
                >
                  Subscribe to Stream
                </Button>
                <Button
                  onClick={() =>
                    injectMarker(
                      this.props.client,
                      Math.random() > 0.5 ? "test1" : "test2",
                      new Date().getTime()
                    )
                  }
                >
                  Inject Marker
                </Button>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row centered>
              <p>{this.state.eegData.join(",  ")}</p>
            </Grid.Row>
            <Grid.Row centered>
              <Link to="experimentRun">
                <Button>Run Experiment</Button>
              </Link>
            </Grid.Row>
            <Grid.Row centered>
              <JupyterPlotWidget
                header="Test"
                mainChannel={this.props.mainChannel}
                defaultCell="test"
              />
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
