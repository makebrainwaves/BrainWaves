import React, { Component } from 'react';
import {
  Grid,
  Icon,
  Segment,
  Header,
  Dropdown,
  Divider,
  Button,
  Checkbox,
  Sidebar,
  DropdownProps,
} from 'semantic-ui-react';
import { isNil, isArray, isString } from 'lodash';
import Plot from 'react-plotly.js';
import styles from './styles/common.css';
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  EXPERIMENTS,
} from '../constants/constants';
import {
  readWorkspaceCleanedEEGData,
  getSubjectNamesFromFiles,
  readWorkspaceBehaviorData,
  readBehaviorData,
  storeAggregatedBehaviorData,
} from '../utils/filesystem/storage';
import {
  aggregateDataForPlot,
  aggregateBehaviorDataToSave,
} from '../utils/behavior/compute';
import SecondaryNavComponent from './SecondaryNavComponent';
import ClickableHeadDiagramSVG from './svgs/ClickableHeadDiagramSVG';
import PyodidePlotWidget from './PyodidePlotWidget';
import { HelpButton } from './CollectComponent/HelpSidebar';
import { PyodideActions } from '../actions/pyodideActions';

const ANALYZE_STEPS = {
  OVERVIEW: 'OVERVIEW',
  ERP: 'ERP',
  BEHAVIOR: 'BEHAVIOR',
};

const ANALYZE_STEPS_BEHAVIOR = {
  BEHAVIOR: 'BEHAVIOR',
};

interface Props {
  title: string;
  type: EXPERIMENTS;
  deviceType: DEVICES;
  isEEGEnabled: boolean;
  mainChannel: any;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;

  channelInfo: Array<string>;
  psdPlot: {
    [key: string]: string;
  };

  topoPlot: {
    [key: string]: string;
  };

  erpPlot: {
    [key: string]: string;
  };

  PyodideActions: typeof PyodideActions;
}

interface State {
  activeStep: string;
  selectedChannel: string;
  eegFilePaths: Array<{
    key: string;
    text: string;
    value: { name: string; dir: string };
  }>;
  behaviorFilePaths: Array<{
    key: string;
    text: string;
    value: string;
  }>;
  selectedFilePaths: Array<string>;
  selectedBehaviorFilePaths: Array<string>;
  selectedSubjects: Array<string>;
  selectedDependentVariable: string;
  removeOutliers: boolean;
  showDataPoints: boolean;
  isSidebarVisible: boolean;
  // TODO: implement outlier display toggle
  // displayOutlierVisible: boolean;
  displayMode: string;
  dataToPlot: number[];
  layout: Record<string, any>;
  helpMode: string;
  dependentVariables: Array<{
    key: string;
    text: string;
    value: string;
  }>;
}
// TODO: Add a channel callback from reading epochs so this screen can be aware of which channels are
// available in dataset
// TODO: Refactor component to DRY up handler functions
export default class Analyze extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep:
        this.props.isEEGEnabled === true
          ? ANALYZE_STEPS.OVERVIEW
          : ANALYZE_STEPS.BEHAVIOR,
      eegFilePaths: [{ key: '', text: '', value: { name: '', dir: '' } }],
      behaviorFilePaths: [{ key: '', text: '', value: '' }],
      dependentVariables: [{ key: '', text: '', value: '' }],
      dataToPlot: [],
      layout: {},
      selectedDependentVariable: '',
      removeOutliers: true,
      showDataPoints: false,
      isSidebarVisible: false,
      // displayOutlierVisible: false,
      displayMode: 'errorbars',
      helpMode: 'errorbars',
      selectedFilePaths: [],
      selectedBehaviorFilePaths: [],
      selectedSubjects: [],
      selectedChannel:
        props.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS[0]
          : MUSE_CHANNELS[0],
    };
    this.handleChannelSelect = this.handleChannelSelect.bind(this);
    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleBehaviorDatasetChange = this.handleBehaviorDatasetChange.bind(
      this
    );
    this.handleDependentVariableChange = this.handleDependentVariableChange.bind(
      this
    );
    this.handleRemoveOutliers = this.handleRemoveOutliers.bind(this);
    this.handleDisplayModeChange = this.handleDisplayModeChange.bind(this);
    this.handleDataPoints = this.handleDataPoints.bind(this);
    this.saveSelectedDatasets = this.saveSelectedDatasets.bind(this);
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    this.toggleDisplayInfoVisibility = this.toggleDisplayInfoVisibility.bind(
      this
    );
  }

  async componentDidMount() {
    const workspaceCleanData = await readWorkspaceCleanedEEGData(
      this.props.title
    );
    const behavioralData = await readWorkspaceBehaviorData(this.props.title);
    this.setState({
      eegFilePaths: workspaceCleanData.map((filepath) => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path,
      })),
      behaviorFilePaths: behavioralData.map((filepath) => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path,
      })),
      dependentVariables: ['Response Time', 'Accuracy'].map((dv) => ({
        key: dv,
        text: dv,
        value: dv,
      })),
      selectedDependentVariable: 'Response Time',
    });
  }

  concatSubjectNames = (subjects: Array<string | null | undefined>) => {
    if (subjects.length < 1) {
      return '';
    }
    return subjects.reduce((acc, curr) => `${acc}-${curr}`);
  };

  handleDatasetChange(event: Record<string, any>, data: DropdownProps) {
    if (isStringArray(data.value)) {
      this.setState({
        selectedFilePaths: data.value,
        selectedSubjects: getSubjectNamesFromFiles(data.value),
      });
      this.props.PyodideActions.LoadCleanedEpochs(data.value);
    }
  }

  handleBehaviorDatasetChange(
    event: Record<string, any>,
    data: Record<string, any>
  ) {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(data.value),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) {
      return;
    }
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      selectedBehaviorFilePaths: data.value,
      selectedSubjects: getSubjectNamesFromFiles(data.value),
      dataToPlot,
      layout,
    });
  }

  async handleDropdownClick() {
    const behavioralData = await readWorkspaceBehaviorData(this.props.title);
    if (behavioralData.length !== this.state.behaviorFilePaths.length) {
      this.setState({
        behaviorFilePaths: behavioralData.map((filepath) => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path,
        })),
      });
    }
  }

  handleDependentVariableChange(
    event: Record<string, any>,
    data: Record<string, any>
  ) {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      data.value,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) {
      return;
    }
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      selectedDependentVariable: data.value,
      dataToPlot,
      layout,
    });
  }

  handleRemoveOutliers(event: Record<string, any>, data: Record<string, any>) {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      this.state.selectedDependentVariable,
      !this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) {
      return;
    }
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      removeOutliers: !this.state.removeOutliers,
      dataToPlot,
      layout,
      helpMode: 'outliers',
    });
  }

  handleDataPoints(event: Record<string, any>, data: Record<string, any>) {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      !this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) {
      return;
    }
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      showDataPoints: !this.state.showDataPoints,
      dataToPlot,
      layout,
    });
  }

  handleDisplayModeChange(displayMode) {
    if (
      this.state.selectedBehaviorFilePaths &&
      this.state.selectedBehaviorFilePaths.length > 0
    ) {
      const aggregatedData = aggregateDataForPlot(
        readBehaviorData(this.state.selectedBehaviorFilePaths),
        this.state.selectedDependentVariable,
        this.state.removeOutliers,
        this.state.showDataPoints,
        displayMode
      );
      if (!aggregatedData) {
        return;
      }
      const { dataToPlot, layout } = aggregatedData;
      this.setState({
        dataToPlot,
        layout,
        displayMode,
        helpMode: displayMode,
      });
    }
  }

  toggleDisplayInfoVisibility() {
    this.setState({
      isSidebarVisible: !this.state.isSidebarVisible,
    });
  }

  saveSelectedDatasets() {
    const data = readBehaviorData(this.state.selectedBehaviorFilePaths);
    const aggregatedData = aggregateBehaviorDataToSave(
      data,
      this.state.removeOutliers
    );
    storeAggregatedBehaviorData(aggregatedData, this.props.title);
  }

  handleChannelSelect(channelName: string) {
    this.setState({ selectedChannel: channelName });
    this.props.PyodideActions.LoadERP(channelName);
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  renderEpochLabels() {
    if (
      !isNil(this.props.epochsInfo) &&
      this.state.selectedFilePaths.length >= 1
    ) {
      const numberConditions = this.props.epochsInfo.filter(
        (infoObj) =>
          infoObj.name !== 'Drop Percentage' && infoObj.name !== 'Total Epochs'
      ).length;
      let colors;
      if (numberConditions === 4) {
        colors = ['red', 'yellow', 'green', 'blue'];
      } else {
        colors = ['red', 'green', 'teal', 'orange'];
      }
      return (
        <div>
          {this.props.epochsInfo
            .filter(
              (infoObj) =>
                infoObj.name !== 'Drop Percentage' &&
                infoObj.name !== 'Total Epochs'
            )
            .map((infoObj, index) => (
              <>
                <Header as="h4">{infoObj.name}</Header>
                <Icon name="circle" color={colors[index]} />
                {infoObj.value}
              </>
            ))}
        </div>
      );
    }
    return <div />;
  }

  renderHelpContent() {
    switch (this.state.helpMode) {
      case 'datapoints':
        return this.renderHelp(
          'Data Points',
          `In this graph, each dot refers to one data point, clustered by group (e.g., conditions).
          It’s the most “neutral” way of presenting the data, of course, but it may be difficult to see any patterns.
          Why is it always a good idea to look at all your datapoints before interpreting any trends in the data?`
        );
      case 'errorbars':
        return this.renderHelp(
          'Bar Graph',
          `Bar graphs are the most common way to summarize data.
          It allows you to compare mean values between groups of datapoints (e.g., conditions),
          and the error bars give some indication of the variance (here: the standard error of the mean).
          Importantly, this way of summarizing data assumes that the mean is in fact representative of the data.
          Many researchers have veered away from bar graphs because they can be deceptive, especially without error bars.
          Can you think of any such cases?`
        );
      case 'whiskers':
        return this.renderHelp(
          'Box Plot',
          `Box plots summarize the data in a more informative way:
          they actually tell you something about the distribution of datapoints within a group,
          by taking the median as its reference point instead of the mean
          (the median is the “middle” point in a dataset after sorting it from the lowest to the highest value).
          The boxes represent so-called “quartiles” which are cut off at the value right between the median and the smallest value or highest value in the dataset.
          The lines (“whiskers”) show how much variability there is in the data outside of those quartiles;
          any outliers are shown as individual points. Can you go through each plot and describe exactly what you see?
          When you toggle between this view and the bar graph view, do the data look very different?`
        );
      case 'outliers':
      default:
        return this.renderHelp(
          'Outliers',
          `A datapoint is tagged as an “outlier” if its value exceeds 2 standard deviations below or above the mean of all data in the group.
          If a datapoint is unusually high or low (it “deviates”) compared to the rest of the group,
          it is likely a special case that doesn’t tell us anything informative about the group as a whole.
          Removing such outliers can help unskew the data. What might outliers mean in your dataset?
          Can you think of any other cases where identifying outliers can be helpful?`
        );
    }
  }

  renderHelp(header: string, content: string) {
    return (
      <>
        <Segment basic className={styles.helpContent}>
          <Button
            circular
            size="large"
            floated="right"
            icon="x"
            className={styles.closeButton}
            onClick={this.toggleDisplayInfoVisibility}
          />
          <Header className={styles.helpHeader} as="h1">
            {header}
          </Header>
          {content}
        </Segment>
      </>
    );
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case ANALYZE_STEPS.OVERVIEW:
      default:
        return (
          <>
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
                  options={this.state.eegFilePaths.map(
                    (eegFilePath) => eegFilePath.value
                  )}
                  onChange={this.handleDatasetChange}
                />
                {this.renderEpochLabels()}
              </Segment>
            </Grid.Column>
            <Grid.Column width={8}>
              <PyodidePlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-Topoplot`}
                plotMIMEBundle={this.props.topoPlot}
              />
            </Grid.Column>
          </>
        );
      case ANALYZE_STEPS.ERP:
        return (
          <>
            <Grid.Column width={4} className={styles.analyzeColumn}>
              <Segment basic textAlign="left" className={styles.infoSegment}>
                <Header as="h1">ERP</Header>
                <p>
                  The event-related potential represents EEG activity elicited
                  by a particular sensory event
                </p>
                <ClickableHeadDiagramSVG
                  channelinfo={this.props.channelInfo}
                  onChannelClick={this.handleChannelSelect}
                />
                <Divider hidden />
                {this.renderEpochLabels()}
              </Segment>
            </Grid.Column>
            <Grid.Column width={8}>
              <PyodidePlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-${this.state.selectedChannel}-ERP`}
                plotMIMEBundle={this.props.erpPlot}
              />
            </Grid.Column>
          </>
        );
      case ANALYZE_STEPS.BEHAVIOR:
        return (
          <>
            <Grid.Column width={4}>
              <Segment basic textAlign="left" className={styles.infoSegment}>
                <Header as="h1">Overview</Header>
                <p>
                  Load datasets from different subjects and view behavioral
                  results
                </p>

                <div>
                  <span className="ui header">Datasets</span>
                  <Button
                    className="export"
                    onClick={this.saveSelectedDatasets}
                  >
                    <Icon name="download" />
                    Export
                  </Button>
                </div>
                <p />

                <Dropdown
                  fluid
                  multiple
                  selection
                  search
                  closeOnChange
                  value={this.state.selectedBehaviorFilePaths}
                  options={this.state.behaviorFilePaths}
                  onChange={this.handleBehaviorDatasetChange}
                  onClick={this.handleDropdownClick}
                />
                <p />
                <Divider hidden />
                <span className="ui header">Dependent Variable</span>
                <p />
                <Dropdown
                  fluid
                  selection
                  closeOnChange
                  value={this.state.selectedDependentVariable}
                  options={this.state.dependentVariables}
                  onChange={this.handleDependentVariableChange}
                />
              </Segment>
            </Grid.Column>
            <Grid.Column
              width={12}
              style={{
                overflow: 'auto',
                maxHeight: 650,
                display: 'grid',
                justifyContent: 'center',
              }}
            >
              <Segment basic textAlign="left" className={styles.plotSegment}>
                <Plot data={this.state.dataToPlot} layout={this.state.layout} />
                <p />
                <Checkbox
                  checked={this.state.removeOutliers}
                  label="Remove Response Time Outliers"
                  onChange={this.handleRemoveOutliers}
                />

                <p />
                <Button.Group>
                  <Button
                    className="tertiary"
                    toggle
                    active={this.state.displayMode === 'datapoints'}
                    onClick={() => this.handleDisplayModeChange('datapoints')}
                  >
                    Data Points
                  </Button>
                  <Button
                    className="tertiary"
                    toggle
                    active={this.state.displayMode === 'errorbars'}
                    onClick={() => this.handleDisplayModeChange('errorbars')}
                  >
                    Bar Graph
                  </Button>
                  <Button
                    className="tertiary"
                    toggle
                    active={this.state.displayMode === 'whiskers'}
                    onClick={() => this.handleDisplayModeChange('whiskers')}
                  >
                    Box Plot
                  </Button>
                </Button.Group>

                <HelpButton onClick={this.toggleDisplayInfoVisibility} />

                <Sidebar
                  width="wide"
                  direction="right"
                  as={Segment}
                  visible={this.state.isSidebarVisible}
                >
                  <Segment basic padded vertical className={styles.helpSidebar}>
                    {this.renderHelpContent()}
                  </Segment>
                </Sidebar>
              </Segment>
            </Grid.Column>
          </>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Analyze"
          steps={
            this.props.isEEGEnabled === true
              ? ANALYZE_STEPS
              : ANALYZE_STEPS_BEHAVIOR
          }
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
        />
        <Grid
          columns="equal"
          textAlign="center"
          verticalAlign="top"
          className={styles.contentGrid}
        >
          {this.renderSectionContent()}
        </Grid>
      </div>
    );
  }
}

function isStringArray(data: any): data is string[] {
  return isArray(data.value) && data.value.every(isString);
}
