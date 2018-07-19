// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Step,
  Segment,
  Header,
  Dropdown,
  Divider,
  Container,
  Label
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./ExperimentDesign.css";
import { EXPERIMENTS, EMOTIV_CHANNELS } from "../constants/constants";
import { readEEGDataDir } from "../utils/filesystem/write";
import JupyterPlotWidget from "./JupyterPlotWidget";

interface Props {
  type: ?EXPERIMENTS;
  kernel: ?Kernel;
  mainChannel: ?any;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  isBusy: boolean;
  eegFilePaths: [?{ key: string, text: string, value: string }];
  selectedFilePaths: [?string];
}

export default class Analyze extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      isBusy: false,
      eegFilePaths: [],
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
      return (
        <div>
          <Segment basic>
            <Icon name="smile" />FACES
            <p>{this.props.epochsInfo["Face"]} Trials</p>
          </Segment>
          <Segment basic>
            <Icon name="home" />HOUSES
            <p>{this.props.epochsInfo["House"]} Trials</p>
          </Segment>
          <Segment basic>
            <Icon name="x" />REJECTION %
            <p>{this.props.epochsInfo["dropPercentage"]}</p>
          </Segment>
        </div>
      );
    }
    return <div />;
  }

  render() {
    return (
      <div className={styles.experimentContainer}>
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
