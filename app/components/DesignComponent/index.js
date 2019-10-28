// @flow
import React, { Component } from 'react';
import { Grid, Button, Segment, Header, Image } from 'semantic-ui-react';
import { isNil } from 'lodash';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import {
  readWorkspaces
} from '../../utils/filesystem/storage';
import {
  MainTimeline,
  Trial,
  ExperimentParameters,
  ExperimentDescription
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import PreviewButton from '../PreviewButtonComponent';

import facesHousesOverview from '../../assets/common/FacesHouses_Overview.png';
import stroopOverview from '../../assets/common/Stroop.png';
import multitaskingOverview from '../../assets/common/Multitasking.png';
import searchOverview from '../../assets/common/VisualSearch.png';
import customOverview from '../../assets/common/Custom.png';

import { loadTimeline } from '../../utils/jspsych/functions';
import { toast } from 'react-toastify';
import InputModal from '../InputModal';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL'
};

interface Props {
  history: Object;
  type: EXPERIMENTS;
  paradigm: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
  experimentActions: Object;
  description: ExperimentDescription;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  isNewExperimentModalOpen: boolean;
  recentWorkspaces: Array<string>;
}

export default class Design extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: (Object, Object) => void;
  handleStartExperiment: Object => void;
  handleCustomizeExperiment: Object => void;
  handlePreview: (Object) => void;
  handleLoadCustomExperiment: string => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW,
      isPreviewing: false,
      isNewExperimentModalOpen: false,
      recentWorkspaces: [],
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleCustomizeExperiment = this.handleCustomizeExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.endPreview = this.endPreview.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
    }
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspaces() });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handleCustomizeExperiment(){
    this.setState({
      isNewExperimentModalOpen: true
    });
  }

  handleLoadCustomExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    // Don't create new workspace if it already exists or title is too short
    if (this.state.recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }
    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    console.log('paradigm', this.props.paradigm)
    this.props.experimentActions.createNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
      paradigm: this.props.paradigm
    });
  }

  handlePreview(e) {
    e.target.blur();
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  renderOverviewIcon(type) {
    switch (type) {
      case EXPERIMENTS.N170:
        return facesHousesOverview;
        break;

      case EXPERIMENTS.STROOP:
        return stroopOverview;
        break;

      case EXPERIMENTS.MULTI:
        return multitaskingOverview;
        break;

      case EXPERIMENTS.SEARCH:
        return searchOverview;
        break;

      case EXPERIMENTS.CUSTOM:
      default:
        return customOverview;
        break;
    }
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case DESIGN_STEPS.BACKGROUND:
        return (
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
            >
            <Header as="h1">{this.props.background_title}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment basic>
                {this.props.background}
              </Segment>

            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.PROTOCOL:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={12}
              textAlign="right"
              verticalAlign="middle"
              className={styles.jsPsychColumn}
            >
              <PreviewExperimentComponent
                {...loadTimeline(this.props.paradigm)}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
                paradigm={this.props.paradigm}
              />
            </Grid.Column>
            <Grid.Column width={4} verticalAlign="middle">
              <Segment as="p" basic>
                {this.props.protocol}
              </Segment>
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={(e) => this.handlePreview(e)}
              />
            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column width={3}>
              <Segment basic padded>
                <Image src={this.renderOverviewIcon(this.props.type)} />
              </Segment>
            </Grid.Column>
            <Grid.Column
              stretched
              width={3}
              textAlign="right"
              verticalAlign="middle"
            >
              <Header as="h1">{this.props.type}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment as="p" basic>
                {this.props.overview}
              </Segment>
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    if (this.props.type === EXPERIMENTS.CUSTOM) {
      return <CustomDesign {...this.props} />;
    }
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Experiment Design"
          steps={DESIGN_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          customizeButton={
            <Button secondary onClick={this.handleCustomizeExperiment}>
              Customize
            </Button>
          }
          button={
            <Button primary onClick={this.handleStartExperiment}>
              Collect Data
            </Button>
          }
        />
        {this.renderSectionContent()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadCustomExperiment}
          onExit={() => this.setState({ isNewExperimentModalOpen: false })}
          header="Enter a title for this experiment"
        />
      </div>
    );
  }
}
