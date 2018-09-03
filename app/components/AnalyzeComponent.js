// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Segment,
  Header,
  Dropdown
} from "semantic-ui-react";
import { isNil } from "lodash";
import styles from "./styles/common.css";
import {
  EXPERIMENTS,
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import { Kernel } from "../constants/interfaces";
import JupyterPlotWidget from "./JupyterPlotWidget";

interface Props {
  type: ?EXPERIMENTS;
  deviceType: DEVICES;
  mainChannel: ?any;
  kernel: ?Kernel;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

export default class Analyze extends Component<Props, State> {
  props: Props;
  handleDropdownChange: (Object, Object) => void;
  handleLoadData: () => void;
  handleAnalyze: () => void;
  handleChannelDropdownChange: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.handleAnalyze = this.handleAnalyze.bind(this);
    this.handleChannelDropdownChange = this.handleChannelDropdownChange.bind(
      this
    );
  }

  componentWillMount() {
    if (isNil(this.props.kernel)) {
      this.props.history.push("/clean");
    }
  }

  handleAnalyze() {
    this.props.jupyterActions.loadPSD();
  }

  handleChannelDropdownChange(e: Object, props: Object) {
    this.props.jupyterActions.loadERP(props.value);
  }

  renderEpochLabels() {
    if (!isNil(this.props.epochsInfo)) {
      const epochsInfo: { [string]: number } = { ...this.props.epochsInfo };
      return (
        <div>
          {Object.keys(epochsInfo).map((key, index) => (
            <Segment key={key} basic>
              <Icon name={["smile", "home", "x", "book"][index]} />
              {key}
              <p>{epochsInfo[key]} Trials</p>
            </Segment>
          ))}
        </div>
      );
    }
    return <div />;
  }

  render() {
    const channels =
      this.props.deviceType === DEVICES.EMOTIV
        ? EMOTIV_CHANNELS
        : MUSE_CHANNELS;
    return (
      <div className={styles.mainContainer}>
        <Grid columns="equal" relaxed padded>
          <Grid.Column width={4}>
            <Segment raised padded color="red">
              <Header as="h2">Data Sets</Header>
              {this.renderEpochLabels()}
              <Button onClick={this.handleAnalyze}>Analyze Data</Button>
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment raised padded color="red">
              <Header as="h2">Average Event-Related Potential</Header>
              <Dropdown
                placeholder="Select Electrode"
                fluid
                selection
                options={channels.map(channelName => ({
                  key: channelName,
                  text: channelName,
                  value: channelName
                }))}
                onChange={this.handleChannelDropdownChange}
              />
              <JupyterPlotWidget plotMIMEBundle={this.props.erpPlot} />
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment raised padded color="red">
              <Header as="h2">Power Spectral Density</Header>
              <JupyterPlotWidget plotMIMEBundle={this.props.psdPlot} />
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
