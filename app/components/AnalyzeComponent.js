// @flow
import React, { Component } from "react";
import {
  Grid,
  Icon,
  Segment,
  Header,
  Dropdown,
  Divider
} from "semantic-ui-react";
import { isNil } from "lodash";
import styles from "./styles/common.css";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import { readWorkspaceCleanedEEGData } from "../utils/filesystem/storage";
import SecondaryNavComponent from "./SecondaryNavComponent";
import JupyterPlotWidget from "./JupyterPlotWidget";

const ANALYZE_STEPS = {
  OVERVIEW: "OVERVIEW",
  ERP: "ERP",
  NOTES: "NOTES"
};

interface Props {
  title: string;
  deviceType: DEVICES;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  topoPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  activeStep: string;
  selectedChannel: string;
  eegFilePaths: Array<?{
    key: string,
    text: string,
    value: { name: string, dir: string }
  }>;
  selectedFilePaths: Array<?string>;
}
// TODO: Add a channel callback from reading epochs so this screen can be aware of which channels are
// available in dataset
export default class Analyze extends Component<Props, State> {
  props: Props;
  state: State;
  handleAnalyze: () => void;
  handleChannelDropdownChange: (Object, Object) => void;
  handleStepClick: (Object, Object) => void;
  handleDatasetChange: (Object, Object) => void;
  handleStepClick: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: ANALYZE_STEPS.OVERVIEW,
      eegFilePaths: [{ key: "", text: "", value: "" }],
      selectedFilePaths: [],
      selectedChannel:
        props.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS[0]
          : MUSE_CHANNELS[0]
    };
    this.handleAnalyze = this.handleAnalyze.bind(this);
    this.handleChannelDropdownChange = this.handleChannelDropdownChange.bind(
      this
    );
    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleStepClick = this.handleStepClick.bind(this);
  }

  async componentDidMount() {
    const workspaceCleanData = await readWorkspaceCleanedEEGData(
      this.props.title
    );
    console.log(workspaceCleanData);
    this.setState({
      eegFilePaths: workspaceCleanData.map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path
      }))
    });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleAnalyze() {
    this.props.jupyterActions.loadERP(null);
  }

  handleDatasetChange(event: Object, data: Object) {
    this.setState({ selectedFilePaths: data.value });
    this.props.jupyterActions.loadCleanedEpochs(data.value);
  }

  handleChannelDropdownChange(e: Object, props: Object) {
    this.setState({ selectedChannel: props.value });
    this.props.jupyterActions.loadERP(props.value);
  }

  renderEpochLabels() {
    if (
      !isNil(this.props.epochsInfo) &&
      this.state.selectedFilePaths.length >= 1
    ) {
      const epochsInfo: { [string]: number } = { ...this.props.epochsInfo };
      return (
        <div>
          {Object.keys(epochsInfo)
            .map((key, index) => (
              <React.Fragment key={key}>
                <Header as="h4">{key}</Header>
                <Icon name="circle" color={["red", "green"][index]} />
                {epochsInfo[key]}
              </React.Fragment>
            ))
            .slice(0, 2)}
        </div>
      );
    }
    return <div />;
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case ANALYZE_STEPS.OVERVIEW:
      default:
        return (
          <Grid
            columns="equal"
            textAlign="center"
            verticalAlign="middle"
            className={styles.contentGrid}
          >
            <Grid.Column width={4}>
              <Segment basic textAlign="left" className={styles.infoSegment}>
                <Header as="h1">Overview</Header>
                <p>
                  Load cleaned datasets from different subjects and view how the
                  EEG differs between electrodes
                </p>
                <Header as="h4">Select Clean Datasets</Header>
                <Dropdown
                  fluid
                  multiple
                  selection
                  closeOnChange
                  value={this.state.selectedFilePaths}
                  options={this.state.eegFilePaths}
                  onChange={this.handleDatasetChange}
                />
                <Divider basic hidden />
                {this.renderEpochLabels()}
              </Segment>
            </Grid.Column>
            <Grid.Column width={8}>
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle="Topoplot"
                plotMIMEBundle={this.props.topoPlot}
              />
            </Grid.Column>
          </Grid>
        );
      case ANALYZE_STEPS.ERP:
        return (
          <Grid
            columns="equal"
            textAlign="center"
            verticalAlign="middle"
            className={styles.contentGrid}
          >
            <Grid.Column width={4}>
              <Segment basic textAlign="left" className={styles.infoSegment}>
                <Header as="h1">ERP</Header>
                <p>
                  The event-related potential represents EEG activity elicited
                  by a particular sensory event
                </p>
                <Header as="h4">Electrode(s)</Header>
                <Dropdown
                  fluid
                  selection
                  closeOnChange
                  value={this.state.selectedChannel}
                  options={EMOTIV_CHANNELS.map(channelName => ({
                    key: channelName,
                    text: channelName,
                    value: channelName
                  }))}
                  onChange={this.handleChannelDropdownChange}
                />
                <Divider basic hidden />
                {this.renderEpochLabels()}
              </Segment>
            </Grid.Column>
            <Grid.Column width={8}>
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle={`${this.state.selectedChannel}-ERP`}
                plotMIMEBundle={this.props.erpPlot}
              />
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Analyze"
          steps={ANALYZE_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
