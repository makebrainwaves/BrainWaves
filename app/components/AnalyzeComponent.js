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
import { EXPERIMENTS, EMOTIV_CHANNELS } from "../constants/constants";
import { Kernel } from "../constants/interfaces";
import { readEEGDataDir } from "../utils/filesystem/write";
import JupyterPlotWidget from "./JupyterPlotWidget";

interface Props {
  type: ?EXPERIMENTS;
  mainChannel: ?any;
  kernel: ?Kernel;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  eegFilePaths: Array<?{
    key: string,
    text: string,
    value: { name: string, dir: string }
  }>;
  selectedFilePaths: Array<?string>;
}

export default class Analyze extends Component<Props, State> {
  props: Props;
  state: State;
  handleDropdownChange: (Object, Object) => void;
  handleLoadData: () => void;
  handleChannelDropdownChange: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      eegFilePaths: [{ key: "", text: "", value: { name: "", dir: "" } }],
      selectedFilePaths: []
    };
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
    this.handleChannelDropdownChange = this.handleChannelDropdownChange.bind(
      this
    );
  }

  componentWillMount() {
    if (isNil(this.props.kernel)) {
      this.props.jupyterActions.launchKernel();
    }
    this.setState({
      eegFilePaths: readEEGDataDir(this.props.type).map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath
      }))
    });
  }

  handleDropdownChange(e: Object, props: Object) {
    this.setState({ selectedFilePaths: props.value });
  }

  handleChannelDropdownChange(e: Object, props: Object) {
    this.props.jupyterActions.loadERP(props.value);
  }

  handleLoadData() {
    this.props.jupyterActions.loadEpochs(this.state.selectedFilePaths);
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
    return (
      <div className={styles.mainContainer}>
        <Grid columns="equal" relaxed padded>
          <Grid.Column width={4}>
            <Segment raised padded color="red">
              <Header as="h2">Data Sets</Header>

              <Segment basic>
                <Dropdown
                  placeholder="Select Data Sets"
                  fluid
                  multiple
                  selection
                  options={this.state.eegFilePaths}
                  onChange={this.handleDropdownChange}
                />
                <Button onClick={this.handleLoadData}>Load</Button>
              </Segment>
              {this.renderEpochLabels()}
            </Segment>
          </Grid.Column>
          <Grid.Column width={6}>
            <Segment raised padded color="red">
              <Header as="h2">Average Event-Related Potential</Header>
              <Dropdown
                placeholder="Select Electrode"
                fluid
                selection
                options={EMOTIV_CHANNELS.map(channelName => ({
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
