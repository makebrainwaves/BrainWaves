import React, { Component } from 'react';
import { Button } from './ui/button';
import { isNil } from 'lodash';
import Plot from 'react-plotly.js';
import type { Data as PlotlyData } from 'plotly.js';
import styles from './styles/common.module.css';
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
  dataToPlot: PlotlyData[];
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
      dataToPlot: [] as PlotlyData[],
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
    this.handleBehaviorDatasetChange =
      this.handleBehaviorDatasetChange.bind(this);
    this.handleDependentVariableChange =
      this.handleDependentVariableChange.bind(this);
    this.handleRemoveOutliers = this.handleRemoveOutliers.bind(this);
    this.handleDisplayModeChange = this.handleDisplayModeChange.bind(this);
    this.handleDataPoints = this.handleDataPoints.bind(this);
    this.saveSelectedDatasets = this.saveSelectedDatasets.bind(this);
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    this.toggleDisplayInfoVisibility =
      this.toggleDisplayInfoVisibility.bind(this);
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

  handleDatasetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    this.setState({
      selectedFilePaths: values,
      selectedSubjects: getSubjectNamesFromFiles(values),
    });
    this.props.PyodideActions.LoadCleanedEpochs(values);
  }

  handleBehaviorDatasetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(values),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      selectedBehaviorFilePaths: values,
      selectedSubjects: getSubjectNamesFromFiles(values),
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

  handleDependentVariableChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      value,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot, layout } = aggregatedData;
    this.setState({ selectedDependentVariable: value, dataToPlot, layout });
  }

  handleRemoveOutliers() {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      this.state.selectedDependentVariable,
      !this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot, layout } = aggregatedData;
    this.setState({ removeOutliers: !this.state.removeOutliers, dataToPlot, layout, helpMode: 'outliers' });
  }

  handleDataPoints() {
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      !this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) return;
    const { dataToPlot, layout } = aggregatedData;
    this.setState({ showDataPoints: !this.state.showDataPoints, dataToPlot, layout });
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
      const colors = numberConditions === 4
        ? ['red', 'yellow', 'green', 'blue']
        : ['red', 'green', 'teal', 'orange'];
      return (
        <div>
          {this.props.epochsInfo
            .filter(
              (infoObj) =>
                infoObj.name !== 'Drop Percentage' &&
                infoObj.name !== 'Total Epochs'
            )
            .map((infoObj, index) => (
              <div key={String(infoObj.name)}>
                <h4>{infoObj.name}</h4>
                <span style={{ color: colors[index] }}>●</span>
                {' '}{infoObj.value}
              </div>
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
      <div className={styles.helpContent}>
        <button
          className={styles.closeButton}
          onClick={this.toggleDisplayInfoVisibility}
          aria-label="Close"
        >✕</button>
        <h1 className={styles.helpHeader}>{header}</h1>
        {content}
      </div>
    );
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case ANALYZE_STEPS.OVERVIEW:
      default:
        return (
          <>
            <div className="w-1/3 p-2 text-left">
              <div className={styles.infoSegment}>
                <h1>Overview</h1>
                <p>
                  Load cleaned datasets from different subjects and view how the
                  EEG differs between electrodes
                </p>
                <h4>Select Clean Datasets</h4>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded p-1"
                  value={this.state.selectedFilePaths}
                  onChange={this.handleDatasetChange}
                >
                  {this.state.eegFilePaths.map((eegFilePath) => (
                    <option key={eegFilePath.key} value={String(eegFilePath.value)}>
                      {eegFilePath.text}
                    </option>
                  ))}
                </select>
                {this.renderEpochLabels()}
              </div>
            </div>
            <div className="w-2/3 p-2">
              <PyodidePlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-Topoplot`}
                plotMIMEBundle={this.props.topoPlot}
              />
            </div>
          </>
        );
      case ANALYZE_STEPS.ERP:
        return (
          <>
            <div className={['w-1/3 p-2 text-left', styles.analyzeColumn].join(' ')}>
              <div className={styles.infoSegment}>
                <h1>ERP</h1>
                <p>
                  The event-related potential represents EEG activity elicited
                  by a particular sensory event
                </p>
                <ClickableHeadDiagramSVG
                  channelinfo={this.props.channelInfo}
                  onChannelClick={this.handleChannelSelect}
                />
                <div className="my-2" />
                {this.renderEpochLabels()}
              </div>
            </div>
            <div className="w-2/3 p-2">
              <PyodidePlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-${this.state.selectedChannel}-ERP`}
                plotMIMEBundle={this.props.erpPlot}
              />
            </div>
          </>
        );
      case ANALYZE_STEPS.BEHAVIOR:
        return (
          <>
            <div className="w-1/3 p-2 text-left">
              <div className={styles.infoSegment}>
                <h1>Overview</h1>
                <p>
                  Load datasets from different subjects and view behavioral results
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Datasets</span>
                  <Button variant="outline" size="sm" onClick={this.saveSelectedDatasets}>
                    ↓ Export
                  </Button>
                </div>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded p-1"
                  value={this.state.selectedBehaviorFilePaths}
                  onChange={this.handleBehaviorDatasetChange}
                  onClick={this.handleDropdownClick}
                >
                  {this.state.behaviorFilePaths.map((fp) => (
                    <option key={fp.key} value={fp.value}>{fp.text}</option>
                  ))}
                </select>
                <div className="my-2" />
                <p className="font-semibold">Dependent Variable</p>
                <select
                  className="w-full border border-gray-300 rounded p-1"
                  value={this.state.selectedDependentVariable}
                  onChange={this.handleDependentVariableChange}
                >
                  {this.state.dependentVariables.map((dv) => (
                    <option key={dv.key} value={dv.value}>{dv.text}</option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="w-2/3 p-2"
              style={{ overflow: 'auto', maxHeight: 650 }}
            >
              <div className={['text-left', styles.plotSegment].join(' ')}>
                <Plot data={this.state.dataToPlot} layout={this.state.layout} />
                <div className="my-2" />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={this.state.removeOutliers}
                    onChange={this.handleRemoveOutliers}
                  />
                  Remove Response Time Outliers
                </label>
                <div className="my-2" />
                <div className="flex gap-1">
                  <button
                    className={['px-3 py-1 border rounded', this.state.displayMode === 'datapoints' ? 'bg-gray-200' : ''].join(' ')}
                    onClick={() => this.handleDisplayModeChange('datapoints')}
                  >
                    Data Points
                  </button>
                  <button
                    className={['px-3 py-1 border rounded', this.state.displayMode === 'errorbars' ? 'bg-gray-200' : ''].join(' ')}
                    onClick={() => this.handleDisplayModeChange('errorbars')}
                  >
                    Bar Graph
                  </button>
                  <button
                    className={['px-3 py-1 border rounded', this.state.displayMode === 'whiskers' ? 'bg-gray-200' : ''].join(' ')}
                    onClick={() => this.handleDisplayModeChange('whiskers')}
                  >
                    Box Plot
                  </button>
                </div>
                <HelpButton onClick={this.toggleDisplayInfoVisibility} />
                {this.state.isSidebarVisible && (
                  <div className={styles.helpSidebar}>
                    {this.renderHelpContent()}
                  </div>
                )}
              </div>
            </div>
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
        <div className={['flex items-start', styles.contentGrid].join(' ')}>
          {this.renderSectionContent()}
        </div>
      </div>
    );
  }
}
