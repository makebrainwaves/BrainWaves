// @flow
import React, { Component } from 'react';
import {
  Grid,
  Icon,
  Segment,
  Header,
  Dropdown,
  Divider,
  Button,
  Checkbox
} from 'semantic-ui-react';
import { isNil } from 'lodash';
import Plot from 'react-plotly.js';
import styles from './styles/common.css';
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from '../constants/constants';
import {
  readWorkspaceCleanedEEGData,
  getSubjectNamesFromFiles,
  readWorkspaceBehaviorData,
  readBehaviorData,
  storeAggregatedBehaviorData,
} from '../utils/filesystem/storage';
import { aggregateDataForPlot, aggregateBehaviorDataToSave } from '../utils/behavior/compute';
import SecondaryNavComponent from './SecondaryNavComponent';
import ClickableHeadDiagramSVG from './svgs/ClickableHeadDiagramSVG';
import JupyterPlotWidget from './JupyterPlotWidget';


const ANALYZE_STEPS = {
  OVERVIEW: 'OVERVIEW',
  ERP: 'ERP',
  BEHAVIOR: 'BEHAVIOR'
};

interface Props {
  title: string;
  deviceType: DEVICES;
  epochsInfo: ?Array<{ [string]: number | string }>;
  channelInfo: ?Array<string>;
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
  behaviorFilePaths: Array<?{
    key: string,
    text: string,
    value: string
  }>;
  selectedFilePaths: Array<?string>;
  selectedSubjects: Array<?string>;
  selectedDependentVariable: string;
  removeOutliers: boolean;
  showDataPoints: boolean;
  displayMode: string,
  dependentVariables: Array<?{
    key: string,
    text: string,
    value: string
  }>;
}
// TODO: Add a channel callback from reading epochs so this screen can be aware of which channels are
// available in dataset
export default class Analyze extends Component<Props, State> {
  props: Props;
  state: State;
  handleChannelSelect: string => void;
  handleStepClick: (Object, Object) => void;
  handleDatasetChange: (Object, Object) => void;
  handleBehaviorDatasetChange: (Object, Object) => void;
  handleDependentVariableChange: (Object, Object) => void;
  handleRemoveOutliers: (Object, Object) => void;
  handleDisplayModeChange: string => void;
  handleDataPoints: (Object, Object) => void;
  saveSelectedDatasets: () => void;
  handleStepClick: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: ANALYZE_STEPS.OVERVIEW,
      eegFilePaths: [{ key: '', text: '', value: '' }],
      behaviorFilePaths: [{ key: '', text: '', value: '' }],
      dependentVariables: [{ key: '', text: '', value: '' }],
      dataToPlot:[],
      layout: {},
      selectedDependentVariable: '',
      removeOutliers: false,
      showDataPoints: false,
      displayMode: 'datapoints',
      selectedFilePaths: [],
      selectedSubjects: [],
      selectedChannel:
        props.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS[0]
          : MUSE_CHANNELS[0]
    };
    this.handleChannelSelect = this.handleChannelSelect.bind(this);
    this.handleDatasetChange = this.handleDatasetChange.bind(this);
    this.handleBehaviorDatasetChange = this.handleBehaviorDatasetChange.bind(this);
    this.handleDependentVariableChange = this.handleDependentVariableChange.bind(this);
    this.handleRemoveOutliers = this.handleRemoveOutliers.bind(this);
    this.handleDisplayModeChange = this.handleDisplayModeChange.bind(this);
    this.handleDataPoints = this.handleDataPoints.bind(this);
    this.saveSelectedDatasets = this.saveSelectedDatasets.bind(this);
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
  }

  async componentDidMount() {
    const workspaceCleanData = await readWorkspaceCleanedEEGData(
      this.props.title
    );
    const behavioralData = await readWorkspaceBehaviorData(this.props.title);
    this.setState({
      eegFilePaths: workspaceCleanData.map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path
      })),
      behaviorFilePaths: behavioralData.map(filepath => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path
      })),
      dependentVariables: ['Response Time', 'Accuracy'].map(dv => ({
        key: dv,
        text: dv,
        value: dv
      })),
      selectedDependentVariable: 'Response Time',
    });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleDatasetChange(event: Object, data: Object) {
    this.setState({
      selectedFilePaths: data.value,
      selectedSubjects: getSubjectNamesFromFiles(data.value)
    });
    this.props.jupyterActions.loadCleanedEpochs(data.value);
  }

  handleBehaviorDatasetChange(event: Object, data: Object) {
    const { dataToPlot, layout } = aggregateDataForPlot(
      readBehaviorData(data.value),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    this.setState({
      selectedFilePaths: data.value,
      selectedSubjects: getSubjectNamesFromFiles(data.value),
      dataToPlot: dataToPlot,
      layout: layout
    });
  }

  async handleDropdownClick(){
    const behavioralData = await readWorkspaceBehaviorData(this.props.title);
    if(behavioralData.length != this.state.behaviorFilePaths.length){
      this.setState({
        behaviorFilePaths: behavioralData.map(filepath => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path
        }))
      });
    }
  }

  handleDependentVariableChange(event: Object, data: Object){
    const { dataToPlot, layout } = aggregateDataForPlot(
      readBehaviorData(this.state.selectedFilePaths),
      data.value,
      this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    this.setState({
      selectedDependentVariable: data.value,
      dataToPlot: dataToPlot,
      layout: layout
    });
  }

  handleRemoveOutliers(event: Object, data: Object){
    const { dataToPlot, layout } = aggregateDataForPlot(
      readBehaviorData(this.state.selectedFilePaths),
      this.state.selectedDependentVariable,
      !this.state.removeOutliers,
      this.state.showDataPoints,
      this.state.displayMode
    );
    this.setState({
      removeOutliers: !this.state.removeOutliers,
      dataToPlot: dataToPlot,
      layout: layout
    });
  }

  handleDataPoints(event: Object, data: Object){
    const { dataToPlot, layout } = aggregateDataForPlot(
      readBehaviorData(this.state.selectedFilePaths),
      this.state.selectedDependentVariable,
      this.state.removeOutliers,
      !this.state.showDataPoints,
      this.state.displayMode
    );
    this.setState({
      showDataPoints: !this.state.showDataPoints,
      dataToPlot: dataToPlot,
      layout: layout
    });
  }

  handleDisplayModeChange(displayMode){
    if(this.state.selectedFilePaths && this.state.selectedFilePaths.length > 0){
      console.log("displayMode", displayMode)
      const { dataToPlot, layout } = aggregateDataForPlot(
        readBehaviorData(this.state.selectedFilePaths),
        this.state.selectedDependentVariable,
        this.state.removeOutliers,
        this.state.showDataPoints,
        displayMode
      );
      this.setState({
        dataToPlot: dataToPlot,
        layout: layout,
        displayMode: displayMode
      });
    }
  }

  saveSelectedDatasets(){
    const data = readBehaviorData(this.state.selectedFilePaths);
    const aggregatedData = aggregateBehaviorDataToSave(data, this.state.removeOutliers);
    storeAggregatedBehaviorData(aggregatedData, this.props.title);
  }

  handleChannelSelect(channelName: string) {
    this.setState({ selectedChannel: channelName });
    this.props.jupyterActions.loadERP(channelName);
  }

  concatSubjectNames(subjects: Array<?string>) {
    if (subjects.length < 1) {
      return '';
    }
    return subjects.reduce((acc, curr) => `${acc}-${curr}`);
  }

  renderEpochLabels() {
    if (
      !isNil(this.props.epochsInfo) &&
      this.state.selectedFilePaths.length >= 1
    ) {
      return (
        <div>
          {this.props.epochsInfo
            .map((infoObj, index) => (
              <React.Fragment key={infoObj.name}>
                <Header as="h4">{infoObj.name}</Header>
                <Icon name="circle" color={['red', 'green'][index]} />
                {infoObj.value}
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
                <Divider hidden />
                {this.renderEpochLabels()}
              </Segment>
            </Grid.Column>
            <Grid.Column width={8}>
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-Topoplot`}
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
              <JupyterPlotWidget
                title={this.props.title}
                imageTitle={`${this.concatSubjectNames(
                  this.state.selectedSubjects
                )}-${this.state.selectedChannel}-ERP`}
                plotMIMEBundle={this.props.erpPlot}
              />
            </Grid.Column>
          </Grid>
        );
      case ANALYZE_STEPS.BEHAVIOR:
        return (
          <Grid
            columns="equal"
            textAlign="center"
            verticalAlign="middle"
            className={styles.contentGrid}
          >
            <Grid.Column width={6}>
              <Segment basic textAlign="left" className={styles.infoSegment}>
                <Header as="h1">Overview</Header>
                <p>
                  Load datasets from different subjects and view
                  behavioral results
                </p>

                <div>
                  <span className="ui header">Datasets</span>
                  <Button className='export'
                    onClick={this.saveSelectedDatasets}
                    >
                    <Icon name="download" />
                    Export
                  </Button>
                </div>
                <p></p>

                <Dropdown
                  fluid
                  multiple
                  selection
                  search
                  closeOnChange
                  value={this.state.selectedFilePaths}
                  options={this.state.behaviorFilePaths}
                  onChange={this.handleBehaviorDatasetChange}
                  onClick={this.handleDropdownClick}
                />
                <p></p>
                <Divider hidden />
                <span className="ui header">Dependent Variable</span>
                <p></p>
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
            <Grid.Column width={8}>

              <Segment basic textAlign="left" className={styles.plotSegment}>
                <Plot
                  data={this.state.dataToPlot}
                  layout={this.state.layout}
                />
                <p></p>
                <Checkbox
                  checked={this.state.removeOutliers}
                  label="Remove outliers"
                  onChange={this.handleRemoveOutliers}
                />

                <p></p>
                <Button.Group>
                  <Button className='tertiary'
                    toggle
                    active={this.state.displayMode === 'datapoints'}
                    onClick={()=> this.handleDisplayModeChange('datapoints')}
                    >
                    Data Points
                  </Button>
                  <Button className='tertiary'
                    toggle
                    active={this.state.displayMode === 'errorbars'}
                    onClick={()=> this.handleDisplayModeChange('errorbars')}
                    >
                    Bar Graph
                  </Button>
                  <Button className='tertiary'
                    toggle
                    active={this.state.displayMode === 'whiskers'}
                    onClick={()=> this.handleDisplayModeChange('whiskers')}
                    >
                    Box Plot
                  </Button>
                </Button.Group>
              </Segment>
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
