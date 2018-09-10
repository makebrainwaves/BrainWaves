import React, { Component } from "react";
import { isNil } from "lodash";
import { Grid, Segment, Button } from "semantic-ui-react";
import ViewerComponent from "../ViewerComponent";
import SignalQualityIndicatorComponent from "../SignalQualityIndicatorComponent";
import { PLOTTING_INTERVAL } from "../../constants/constants";

interface Props {
  experimentActions: Object;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  experimentActions: Object;
  availableDevices: Array<any>;
  type: ?EXPERIMENTS;
  isRunning: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  // dir: ?string,
  subject: string;
  session: number;
}

export default class PreTestComponent extends Component<Props> {
  handleStartExperiment: Object => void;

  constructor(props: Props) {
    super(props);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreTest = this.handlePreTest.bind(this);
  }

  handlePreTest() {
    console.log(this.props);
  }

  handleStartExperiment(e: Object) {
    if (this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED) {
      e.preventDefault();
    }
  }

  render() {
    return (
      <Grid columns="equal" textAlign="center" verticalAlign="middle">
        <Grid.Column width={6}>
          <SignalQualityIndicatorComponent
            signalQualityObservable={this.props.signalQualityObservable}
            plottingInterval={PLOTTING_INTERVAL}
          />
        </Grid.Column>
        <Grid.Column width={8}>
          <Button   secondary onClick={this.handlePreTest}>
            Run Pre-Test
          </Button>
          <Button primary onClick={this.handleStartExperiment}>
            Run & Record Experiment
          </Button>
          <ViewerComponent
            signalQualityObservable={this.props.signalQualityObservable}
            deviceType={this.props.deviceType}
            samplingRate={this.props.connectedDevice["samplingRate"]}
            plottingInterval={PLOTTING_INTERVAL}
          />
        </Grid.Column>
      </Grid>
    );
  }
}
