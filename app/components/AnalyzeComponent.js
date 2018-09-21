// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Segment,
  Header,
  Modal,
  Dropdown
} from "semantic-ui-react";
import { isNil } from "lodash";
import styles from "./styles/common.css";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import JupyterPlotWidget from "./JupyterPlotWidget";

interface Props {
  title: string;
  deviceType: DEVICES;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  selectedChannel: string;
}

export default class Analyze extends Component<Props, State> {
  props: Props;
  state: State;
  handleAnalyze: () => void;
  handleChannelDropdownChange: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedChannel:
        props.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS[0]
          : MUSE_CHANNELS[0]
    };
    this.handleAnalyze = this.handleAnalyze.bind(this);
    this.handleChannelDropdownChange = this.handleChannelDropdownChange.bind(
      this
    );
  }

  handleAnalyze() {
    this.props.jupyterActions.loadPSD();
    this.props.jupyterActions.loadERP(null);
  }

  handleChannelDropdownChange(e: Object, props: Object) {
    this.setState({ selectedChannel: props.value });
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
        <Modal
          basic
          open={isNil(this.props.epochsInfo)}
          header="No Data!"
          content="Would you like to load some data?"
          actions={[{ key: "ok", content: "OK", positive: true }]}
          onActionClick={() => this.props.history.push("/clean")}
        />
        <Grid columns="equal" relaxed padded>
          <Grid.Column width={4}>
            <Segment raised padded color="red">
              <Header as="h2">Data Sets</Header>
              {this.renderEpochLabels()}
              <Button primary onClick={this.handleAnalyze}>
                Analyze Data
              </Button>
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
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle={`${this.state.selectedChannel}-ERP`}
                plotMIMEBundle={this.props.erpPlot}
              />
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment raised padded color="red">
              <Header as="h2">Power Spectral Density</Header>
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle="PSD"
                plotMIMEBundle={this.props.psdPlot}
              />
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
