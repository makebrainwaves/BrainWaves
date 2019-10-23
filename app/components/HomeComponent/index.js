// @flow
import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Grid, Button, Header, Segment, Image } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS, KERNEL_STATUS } from '../../constants/constants';
import faceHouseIcon from '../../assets/common/FacesHouses.png';
import stroopIcon from '../../assets/common/Stroop.png';
import multitaskingIcon from '../../assets/common/Multitasking.png';
import searchIcon from '../../assets/common/VisualSearch.png';
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
        type: experimentType,
        paradigm: experimentType
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
          <Grid columns="two" relaxed padded>
            <Grid.Row>
              <Grid.Column>
                <Segment>
                  <Grid
                    columns="two"
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={faceHouseIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as="h1" className={styles.experimentCardHeader}>Faces/Houses</Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Explore the N170 event-related potential that is produced in
                            response to viewing faces. It is called the N170 because it is
                            a negative, downwards-facing wave that occurs around 170
                            milliseconds after perceiving a face.
                          </p>
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>

              </Grid.Column>

              <Grid.Column>
                <Segment>
                  <Grid
                    columns="two"
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={stroopIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as="h1" className={styles.experimentCardHeader}>Stroop</Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Investigate the cognitive process of selective attention with
                            the Stroop Task, a challenging experiment requiring the
                            subject to name the color of a word instead of reading the
                            word itself.
                          </p>
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>

            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <Segment>
                  <Grid
                    columns="two"
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.MULTI)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={multitaskingIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as="h1" className={styles.experimentCardHeader}>Multi-tasking</Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            The multi-tasking test
                          </p>
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>

              <Grid.Column>
                <Segment>
                  <Grid
                    columns="two"
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.SEARCH)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={searchIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as="h1" className={styles.experimentCardHeader}>Attention</Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            The visual search task
                          </p>
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>
            </Grid.Row>
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
