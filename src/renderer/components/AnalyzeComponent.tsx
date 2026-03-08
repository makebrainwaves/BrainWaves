import React, { Component } from 'react';
import { isNil, isArray, isString } from 'lodash';
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

  handleDatasetChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedValues = Array.from(event.target.selectedOptions).map(
      (opt) => opt.value
    );
    if (isStringArray(selectedValues)) {
      this.setState({
        selectedFilePaths: selectedValues,
        selectedSubjects: getSubjectNamesFromFiles(selectedValues),
      });
      this.props.PyodideActions.LoadCleanedEpochs(selectedValues);
    }
  }

  handleBehaviorDatasetChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedValues = Array.from(event.target.selectedOptions).map(
      (opt) => opt.value
    );
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(selectedValues),
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
      selectedBehaviorFilePaths: selectedValues,
      selectedSubjects: getSubjectNamesFromFiles(selectedValues),
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
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;
    const aggregatedData = aggregateDataForPlot(
      readBehaviorData(this.state.selectedBehaviorFilePaths),
      value,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    if (!aggregatedData) {
      return;
    }
    const { dataToPlot, layout } = aggregatedData;
    this.setState({
      selectedDependentVariable: value,
      dataToPlot,
      layout,
    });
  }

  handleRemoveOutliers(event: React.ChangeEvent<HTMLInputElement>) {
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

  handleDataPoints(event: React.ChangeEvent<HTMLInputElement>) {
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
        colors = ['text-red-500', 'text-yellow-500', 'text-green-500', 'text-blue-500'];
      } else {
        colors = ['text-red-500', 'text-green-500', 'text-teal-500', 'text-orange-500'];
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
                <h4 className="text-base font-semibold">{infoObj.name}</h4>
                <span className={`${colors[index]}`}>&#9679;</span>
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
          It's the most "neutral" way of presenting the data, of course, but it may be difficult to see any patterns.
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
          (the median is the "middle" point in a dataset after sorting it from the lowest to the highest value).
          The boxes represent so-called "quartiles" which are cut off at the value right between the median and the smallest value or highest value in the dataset.
          The lines ("whiskers") show how much variability there is in the data outside of those quartiles;
          any outliers are shown as individual points. Can you go through each plot and describe exactly what you see?
          When you toggle between this view and the bar graph view, do the data look very different?`
        );
      case 'outliers':
      default:
        return this.renderHelp(
          'Outliers',
          `A datapoint is tagged as an "outlier" if its value exceeds 2 standard deviations below or above the mean of all data in the group.
          If a datapoint is unusually high or low (it "deviates") compared to the rest of the group,
          it is likely a special case that doesn't tell us anything informative about the group as a whole.
          Removing such outliers can help unskew the data. What might outliers mean in your dataset?
          Can you think of any other cases where identifying outliers can be helpful?`
        );
    }
  }

  renderHelp(header: string, content: string) {
    return (
      <>
        <div className={`p-4 ${styles.helpContent}`}>
          <button
            className="float-right bg-gray-200 text-gray-800 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors font-medium"
            onClick={this.toggleDisplayInfoVisibility}
          >
            ✕
          </button>
          <h1 className={`text-2xl font-bold ${styles.helpHeader}`}>
            {header}
          </h1>
          {content}
        </div>
      </>
    );
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case ANALYZE_STEPS.OVERVIEW:
      default:
        return (
          <>
            <div className="col-span-4">
              <div className={`text-left p-4 ${styles.infoSegment}`}>
                <h1 className="text-2xl font-bold">Overview</h1>
                <p>
                  Load cleaned datasets from different subjects and view how the
                  EEG differs between electrodes
                </p>
                <h4 className="text-base font-semibold mt-4 mb-1">
                  Select Clean Datasets
                </h4>
                <select
                  multiple
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={this.state.selectedFilePaths}
                  onChange={this.handleDatasetChange}
                >
                  {this.state.eegFilePaths.map((eegFilePath) => (
                    <option
                      key={eegFilePath.key}
                      value={eegFilePath.key}
                    >
                      {eegFilePath.text}
                    </option>
                  ))}
                </select>
                {this.renderEpochLabels()}
              </div>
            </div>
            <div className="col-span-8">
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
            <div className={`col-span-4 ${styles.analyzeColumn}`}>
              <div className={`text-left p-4 ${styles.infoSegment}`}>
                <h1 className="text-2xl font-bold">ERP</h1>
                <p>
                  The event-related potential represents EEG activity elicited
                  by a particular sensory event
                </p>
                <ClickableHeadDiagramSVG
                  channelinfo={this.props.channelInfo}
                  onChannelClick={this.handleChannelSelect}
                />
                <hr className="my-4 border-gray-200" />
                {this.renderEpochLabels()}
              </div>
            </div>
            <div className="col-span-8">
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
            <div className="col-span-4">
              <div className={`text-left p-4 ${styles.infoSegment}`}>
                <h1 className="text-2xl font-bold">Overview</h1>
                <p>
                  Load datasets from different subjects and view behavioral
                  results
                </p>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">Datasets</span>
                  <button
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
                    onClick={this.saveSelectedDatasets}
                  >
                    ⬇ Export
                  </button>
                </div>
                <p />

                <select
                  multiple
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={this.state.selectedBehaviorFilePaths}
                  onChange={this.handleBehaviorDatasetChange}
                  onClick={this.handleDropdownClick}
                >
                  {this.state.behaviorFilePaths.map((filepath) => (
                    <option key={filepath.key} value={filepath.value}>
                      {filepath.text}
                    </option>
                  ))}
                </select>
                <p />
                <hr className="my-4 border-gray-200" />
                <span className="font-semibold">Dependent Variable</span>
                <p />
                <select
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={this.state.selectedDependentVariable}
                  onChange={this.handleDependentVariableChange}
                >
                  {this.state.dependentVariables.map((dv) => (
                    <option key={dv.key} value={dv.value}>
                      {dv.text}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="col-span-12"
              style={{
                overflow: 'auto',
                maxHeight: 650,
                display: 'grid',
                justifyContent: 'center',
              }}
            >
              <div className={`text-left p-4 ${styles.plotSegment}`}>
                <Plot data={this.state.dataToPlot} layout={this.state.layout} />
                <p />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={this.state.removeOutliers}
                    onChange={this.handleRemoveOutliers}
                    className="w-4 h-4"
                  />
                  Remove Response Time Outliers
                </label>

                <p />
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      this.state.displayMode === 'datapoints'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={() => this.handleDisplayModeChange('datapoints')}
                  >
                    Data Points
                  </button>
                  <button
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      this.state.displayMode === 'errorbars'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={() => this.handleDisplayModeChange('errorbars')}
                  >
                    Bar Graph
                  </button>
                  <button
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      this.state.displayMode === 'whiskers'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={() => this.handleDisplayModeChange('whiskers')}
                  >
                    Box Plot
                  </button>
                </div>

                <HelpButton onClick={this.toggleDisplayInfoVisibility} />

                {this.state.isSidebarVisible && (
                  <div className="border rounded-lg p-4 bg-white shadow-sm mt-4">
                    <div className={`p-4 ${styles.helpSidebar}`}>
                      {this.renderHelpContent()}
                    </div>
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
        <div
          className={`grid grid-cols-12 gap-4 text-center ${styles.contentGrid}`}
        >
          {this.renderSectionContent()}
        </div>
      </div>
    );
  }
}

function isStringArray(data: any): data is string[] {
  return isArray(data) && data.every(isString);
}
