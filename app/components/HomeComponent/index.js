// @flow
import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Grid, Button, Header, Segment, Image } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS, KERNEL_STATUS } from '../../constants/constants';
import faceHouseIcon from '../../assets/common/FacesHouses.png';
import customIcon from '../../assets/common/Custom.png';
import appLogo from '../../assets/common/app_logo.png';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir
} from '../../utils/filesystem/storage';
import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';
import { loadTimeline } from '../../utils/jspsych/functions';

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
  overviewExperimentType: EXPERIMENTS;
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleNewExperiment: EXPERIMENTS => void;
  handleStepClick: string => void;
  handleLoadCustomExperiment: string => void;
  handleOpenOverview: EXPERIMENTS => void;
  handleCloseOverview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.NEW,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      overviewExperimentType: EXPERIMENTS.NONE
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(
      this
    );
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
    if (experimentType === EXPERIMENTS.CUSTOM) {
      this.setState({
        isNewExperimentModalOpen: true
      });
      // If pre-designed experiment, load existing workspace
    } else if (this.state.recentWorkspaces.includes(experimentType)) {
      this.handleLoadRecentWorkspace(experimentType);
      // Create pre-designed workspace if opened for first time
    } else {
      this.props.experimentActions.createNewWorkspace({
        title: experimentType,
        type: experimentType
      });
      this.props.history.push(SCREENS.DESIGN.route);
    }
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
    this.props.experimentActions.createNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM
    });
    this.props.history.push(SCREENS.DESIGN.route);
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
      overviewExperimentType: type,
      isOverviewComponentOpen: true
    });
  }

  handleCloseOverview() {
    this.setState({
      isOverviewComponentOpen: false
    });
  }

  // TODO: Figure out how to make this not overflow when there's tons of workspaces. Lists?
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
                <Image src={faceHouseIcon} />
                <Header as="h1">Faces and Houses</Header>
                <p>
                  Explore the N170 event-related potential that is produced in
                  response to viewing faces. It is called the N170 because it is
                  a negative, downwards-facing wave that occurs around 170
                  milliseconds after perceiving a face.
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
                <Image src={faceHouseIcon} />
                <Header as="h1">Stroop</Header>
                <p>
                  Investigate the cognitive process of selective attention with
                  the Stroop Task, a challenging experiment requiring the
                  subject to name the color of a word instead of reading the
                  word itself.
                </p>
                <Button
                  secondary
                  onClick={() => this.handleOpenOverview(EXPERIMENTS.STROOP)}
                >
                  Review
                </Button>
                <Button secondary>
                  Customize
                </Button>
                <Button
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image src={faceHouseIcon} />
                <Header as="h1">Multi-tasking</Header>
                <p>
                  The multi-tasking test
                </p>
                <Button
                  secondary
                  onClick={() => this.handleOpenOverview(EXPERIMENTS.MULTI)}
                >
                  Review
                </Button>
                <Button
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.MULTI)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image src={faceHouseIcon} />
                <Header as="h1">Attention</Header>
                <p>
                  The visual search task
                </p>
                <Button
                  secondary
                  onClick={() => this.handleOpenOverview(EXPERIMENTS.SEARCH)}
                >
                  Review
                </Button>
                <Button
                  primary
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.SEARCH)}
                >
                  Start Experiment
                </Button>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment basic className={styles.descriptionContainer}>
                <Image src={customIcon} />
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
          {...loadTimeline(this.state.overviewExperimentType)}
          type={this.state.overviewExperimentType}
          onStartExperiment={this.handleNewExperiment}
          onCloseOverview={this.handleCloseOverview}
        />
      );
    }
    return (
      <React.Fragment>
        <SecondaryNavComponent
          title={<Image src={appLogo} />}
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
          onClose={this.handleLoadCustomExperiment}
          onExit={() => this.setState({ isNewExperimentModalOpen: false })}
          header="Enter a title for this experiment"
        />
      </div>
    );
  }
}
