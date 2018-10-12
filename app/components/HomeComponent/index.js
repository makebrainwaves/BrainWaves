// @flow
import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Grid, Button, Header, Segment, Image } from 'semantic-ui-react';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS, KERNEL_STATUS } from '../../constants/constants';
import faceHouseIcon from '../../assets/face_house/face_house_icon.jpg';
import brainwavesLogo from '../../assets/common/brainwaves_logo.png';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir
} from '../../utils/filesystem/storage';
import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';

const HOME_STEPS = {
  RECENT: 'RECENT',
  NEW: 'EXPERIMENTS'
};

interface Props {
  kernelStatus: KERNEL_STATUS;
  history: Object;
  jupyterActions: Object;
  deviceActions: Object;
  experimentActions: Object;
}

interface State {
  activeStep: string;
  recentWorkspaces: Array<string>;
  isNewExperimentModalOpen: boolean;
  isOverviewComponentOpen: boolean;
  selectedExperimentType: EXPERIMENTS;
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleNewExperiment: EXPERIMENTS => void;
  handleStepClick: string => void;
  handleLoadNewExperiment: string => void;
  handleOpenOverview: EXPERIMENTS => void;
  handleCloseOverview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.NEW,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      selectedExperimentType: EXPERIMENTS.NONE
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadNewExperiment = this.handleLoadNewExperiment.bind(this);
    this.handleOpenOverview = this.handleOpenOverview.bind(this);
    this.handleCloseOverview = this.handleCloseOverview.bind(this);
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspaces() });
    if (this.props.kernelStatus === KERNEL_STATUS.OFFLINE) {
      this.props.jupyterActions.launchKernel();
    }
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleNewExperiment(experimentType: EXPERIMENTS) {
    this.setState({
      isNewExperimentModalOpen: true,
      selectedExperimentType: experimentType
    });
  }

  handleLoadNewExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    // Don't create new workspace if it already exists or title is too short
    if (!this.state.recentWorkspaces.includes(title) && title.length >= 1) {
      this.props.experimentActions.createNewWorkspace({
        title,
        type: this.state.selectedExperimentType
      });
      this.props.history.push(SCREENS.DESIGN.route);
    }
  }

  handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = readAndParseState(dir);
    if (!isNil(recentWorkspaceState)) {
      this.props.experimentActions.setState(recentWorkspaceState);
    }
    this.props.history.push(SCREENS.DESIGN.route);
  }

  handleOpenOverview(type: EXPERIMENTS) {
    this.setState({
      selectedExperimentType: type,
      isOverviewComponentOpen: true
    });
  }

  handleCloseOverview() {
    this.setState({
      isOverviewComponentOpen: false
    });
  }

  // TODO: Figure out how to make this not overflow. Lists?
  renderSectionContent() {
    switch (this.state.activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <Grid stackable padded columns="equal">
            {this.state.recentWorkspaces.map(dir => (
              <Grid.Row key={dir}>
                <Button
                  secondary
                  onClick={() => this.handleLoadRecentWorkspace(dir)}
                >
                  Open Experiment
                </Button>
                <Segment className={styles.recentDirSegment} vertical basic>
                  <Header as="h3">{dir}</Header>
                </Segment>
                <Button
                  icon="folder open outline"
                  basic
                  circular
                  size="huge"
                  className={styles.closeButton}
                  onClick={() => openWorkspaceDir(dir)}
                />
              </Grid.Row>
            ))}
          </Grid>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <Grid columns="equal" relaxed padded>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image size="huge" src={faceHouseIcon} />
                <Header as="h1">Faces and Houses</Header>
                <p>
                  Explore the N170 ERP that is produce in response to viewing
                  faces (as compared to non human objects). It is called the
                  N170 because it is a negative deflection that occurs around
                  170ms after perceiving a face.
                </p>
                <Button
                  secondary
                  onClick={() => this.handleOpenOverview(EXPERIMENTS.N170)}
                >
                  Review
                </Button>
                <Button
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image size="huge" src={faceHouseIcon} />
                <Header as="h1">Stroop</Header>
                <p>
                  Investigate the cognitive process of selective attention with
                  the Stroop Task, a challenging experiment requiring the
                  subject to name the color of a word instead of reading the
                  word itself.
                </p>
                <Button disabled secondary>
                  Review
                </Button>
                <Button
                  disabled
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image size="huge" src={faceHouseIcon} />
                <Header as="h1">Custom</Header>
                <p>Design your own EEG experiment!</p>
                <Button secondary disabled>
                  Review
                </Button>
                <Button
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.CUSTOM)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
          </Grid>
        );
    }
  }

  renderOverviewOrHome() {
    if (this.state.isOverviewComponentOpen) {
      return (
        <OverviewComponent
          type={this.state.selectedExperimentType}
          onStartExperiment={this.handleNewExperiment}
          onCloseOverview={this.handleCloseOverview}
        />
      );
    }
    return (
      <React.Fragment>
        <SecondaryNavComponent
          title={<Image src={brainwavesLogo} />}
          steps={HOME_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
        />
        <div className={styles.homeContentContainer}>
          {this.renderSectionContent()}
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={styles.mainContainer} data-tid="container">
        {this.renderOverviewOrHome()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadNewExperiment}
          header="Enter a title for this experiment"
        />
      </div>
    );
  }
}
