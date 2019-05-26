// @flow
import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Grid, Button, Header, Segment, Image, Table } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import * as moment from 'moment';

import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import faceHouseIcon from '../../assets/common/FacesHouses.png';
import stroopIcon from '../../assets/common/Stroop.png';
import multitaskingIcon from '../../assets/common/Multitasking.png';
import searchIcon from '../../assets/common/VisualSearch.png';
import customIcon from '../../assets/common/Custom.png';
import appLogo from '../../assets/common/app_logo.png';
import divingMan from '../../assets/common/divingMan.svg';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
} from '../../utils/filesystem/storage';

import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';
import { loadTimeline } from '../../utils/jspsych/functions';
import { languagePluginLoader } from '../../utils/pyodide/pyodide';

// this initiates pyodide
languagePluginLoader;

const HOME_STEPS = {
  // TODO: maybe change the recent and new labels, but not necessary right now
  RECENT: 'MY EXPERIMENTS',
  NEW: 'EXPERIMENT BANK',
  EXPLORE: 'EXPLORE EEG DATA',
};

interface Props {
  history: Object;
  deviceActions: Object;
  availableDevices: Array<any>;
  experimentActions: Object;
  pyodideActions: Object;
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
  handleNewExperiment: (EXPERIMENTS) => void;
  handleStepClick: (string) => void;
  handleLoadCustomExperiment: (string) => void;
  handleOpenOverview: (EXPERIMENTS) => void;
  handleCloseOverview: () => void;
  handleDeleteWorkspace: (string) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.RECENT,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      overviewExperimentType: EXPERIMENTS.NONE,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(this);
    this.handleOpenOverview = this.handleOpenOverview.bind(this);
    this.handleCloseOverview = this.handleCloseOverview.bind(this);
    this.handleDeleteWorkspace = this.handleDeleteWorkspace.bind(this);
  }

  componentDidMount() {
    this.props.pyodideActions.launch();
    this.setState({ recentWorkspaces: readWorkspaces() });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleNewExperiment(experimentType: EXPERIMENTS) {
    if (experimentType === EXPERIMENTS.CUSTOM) {
      this.setState({
        isNewExperimentModalOpen: true,
      });
      // If pre-designed experiment, load existing workspace
    } else if (this.state.recentWorkspaces.includes(experimentType)) {
      this.handleLoadRecentWorkspace(experimentType);
      // Create pre-designed workspace if opened for first time
    } else {
      this.props.experimentActions.createNewWorkspace({
        title: experimentType,
        type: experimentType,
        paradigm: experimentType,
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
      type: EXPERIMENTS.CUSTOM,
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
      isOverviewComponentOpen: true,
    });
  }

  handleCloseOverview() {
    this.setState({
      isOverviewComponentOpen: false,
    });
  }

  handleDeleteWorkspace(dir) {
    const options = {
      buttons: ['No', 'Yes'],
      message: 'Do you really want to delete the experiment?',
    };
    const response = dialog.showMessageBox(options);
    if (response === 1) {
      deleteWorkspaceDir(dir);
      this.setState({ recentWorkspaces: readWorkspaces() });
    }
  }

  // TODO: Figure out how to make this not overflow when there's tons of workspaces. Lists?
  renderSectionContent() {
    switch (this.state.activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <Grid stackable padded columns='equal' className={styles.myExperimentsPage}>
            {this.state.recentWorkspaces.length > 0 ? (
              <Table basic='very'>
                <Table.Header>
                  <Table.Row className={styles.experimentHeaderRow}>
                    <Table.HeaderCell className={styles.experimentHeaderName}>
                      Experiment name
                    </Table.HeaderCell>
                    <Table.HeaderCell>Date Last Opened</Table.HeaderCell>
                    <Table.HeaderCell className={styles.experimentHeaderActionsName}>
                      Actions
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body className={styles.experimentTable}>
                  {this.state.recentWorkspaces
                    .sort((a, b) => {
                      const aTime = readAndParseState(a).params.dateModified || 0;
                      const bTime = readAndParseState(b).params.dateModified || 0;
                      return bTime - aTime;
                    })
                    .map((dir) => {
                      const {
                        params: { dateModified },
                      } = readAndParseState(dir);
                      return (
                        <Table.Row key={dir} className={styles.experimentRow}>
                          <Table.Cell className={styles.experimentRowName}>{dir}</Table.Cell>
                          <Table.Cell className={styles.experimentRowName}>
                            {dateModified && moment.default(dateModified).fromNow()}
                          </Table.Cell>
                          <Table.Cell className={styles.experimentRowName}>
                            <Button
                              secondary
                              onClick={() => this.handleDeleteWorkspace(dir)}
                              className={styles.experimentBtn}
                            >
                              Delete
                            </Button>
                            <Button
                              secondary
                              onClick={() => openWorkspaceDir(dir)}
                              className={styles.experimentBtn}
                            >
                              Go to Folder
                            </Button>
                            <Button
                              primary
                              onClick={() => this.handleLoadRecentWorkspace(dir)}
                              className={styles.experimentBtn}
                            >
                              Open Experiment
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                </Table.Body>
              </Table>
            ) : (
              <Grid.Column textAlign='center'>
                <Image src={divingMan} centered className={styles.noExperimentsImage} />
                <Header className={styles.noExperimentsTitle}>
                  You don&apos;t have any experiments yet
                </Header>
                <p className={styles.noExperimentsText}>
                  Head over to the &quot;Experiment Bank&quot; section to start an experiment.
                </p>
                <Button primary onClick={() => this.handleStepClick('EXPERIMENT BANK')}>
                  View Experiments
                </Button>
              </Grid.Column>
            )}
          </Grid>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <Grid columns='two' relaxed padded>
            <Grid.Row>
              <Grid.Column>
                <Segment>
                  <Grid
                    columns='two'
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={faceHouseIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as='h1' className={styles.experimentCardHeader}>
                          Faces/Houses
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Explore how people react to different kinds of images, like faces vs.
                            houses.
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
                    columns='two'
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={stroopIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as='h1' className={styles.experimentCardHeader}>
                          Stroop
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Investigate why it is hard to deal with contradictory information (like
                            the word "RED" printed in blue).
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
                    columns='two'
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.MULTI)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={multitaskingIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as='h1' className={styles.experimentCardHeader}>
                          Multi-tasking
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Explore why it is challenging to carry out multiple tasks at the same
                            time.
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
                    columns='two'
                    className={styles.experimentCard}
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.SEARCH)}
                  >
                    <Grid.Row>
                      <Grid.Column width={4} className={styles.experimentCardImage}>
                        <Image src={searchIcon} />
                      </Grid.Column>
                      <Grid.Column width={12} className={styles.descriptionContainer}>
                        <Header as='h1' className={styles.experimentCardHeader}>
                          Visual Search
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>Examine why it is difficult to find your keys in a messy room.</p>
                        </div>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        );
      case HOME_STEPS.EXPLORE:
        return (
          <EEGExplorationComponent
            history={this.props.history}
            connectedDevice={this.props.connectedDevice}
            signalQualityObservable={this.props.signalQualityObservable}
            deviceType={this.props.deviceType}
            deviceAvailability={this.props.deviceAvailability}
            connectionStatus={this.props.connectionStatus}
            availableDevices={this.props.availableDevices}
            deviceActions={this.props.deviceActions}
          />
        );
    }
  }

  renderOverviewOrHome() {
    if (this.state.isOverviewComponentOpen) {
      return (
        <OverviewComponent
          {...loadProtocol(this.state.overviewExperimentType)}
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
        <div className={styles.homeContentContainer}>{this.renderSectionContent()}</div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={styles.mainContainer} data-tid='container'>
        {this.renderOverviewOrHome()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadCustomExperiment}
          onExit={() => this.setState({ isNewExperimentModalOpen: false })}
          header='Enter a title for this experiment'
        />
      </div>
    );
  }
}
