import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Grid, Button, Header, Segment, Image, Table } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import * as moment from 'moment';
import { History } from 'history';
import { remote } from 'electron';
import { Observable } from 'rxjs';
import styles from '../styles/common.css';
import {
  EXPERIMENTS,
  SCREENS,
  KERNEL_STATUS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import faceHouseIcon from '../../experiments/faces_houses/icon.png';
import stroopIcon from '../../experiments/stroop/icon.png';
import multitaskingIcon from '../../experiments/multitasking/icon.png';
import searchIcon from '../../experiments/search/icon.png';
import customIcon from '../../experiments/custom/icon.png';
import appLogo from '../../assets/common/app_logo.png';
import divingMan from '../../assets/common/divingMan.svg';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
} from '../../utils/filesystem/storage';
import {
  JupyterActions,
  DeviceActions,
  ExperimentActions,
} from '../../actions';
import { ExperimentCard } from './ExperimentCard';
import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';
import EEGExplorationComponent from '../EEGExplorationComponent';
import { SignalQualityData } from '../../constants/interfaces';

const { dialog } = remote;

const HOME_STEPS = {
  // TODO: maybe change the recent and new labels, but not necessary right now
  RECENT: 'MY EXPERIMENTS',
  NEW: 'EXPERIMENT BANK',
  EXPLORE: 'EXPLORE EEG DATA',
};

export interface Props {
  activeStep?: string;
  availableDevices: Array<any>;
  connectedDevice: Record<string, unknown>;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  deviceAvailability: DEVICE_AVAILABILITY;
  deviceType: DEVICES;
  ExperimentActions: typeof ExperimentActions;
  history: History;
  JupyterActions: typeof JupyterActions;
  kernelStatus: KERNEL_STATUS;
  signalQualityObservable?: Observable<SignalQualityData>;
}

interface State {
  activeStep: string;
  isNewExperimentModalOpen: boolean;
  isOverviewComponentOpen: boolean;
  recentWorkspaces: Array<string>;
  overviewExperimentType: EXPERIMENTS;
}

export default class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: this.props.activeStep || HOME_STEPS.RECENT,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      overviewExperimentType: EXPERIMENTS.NONE,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(
      this
    );
    this.handleOpenOverview = this.handleOpenOverview.bind(this);
    this.handleCloseOverview = this.handleCloseOverview.bind(this);
    this.handleDeleteWorkspace = this.handleDeleteWorkspace.bind(this);
  }

  componentDidMount() {
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
      this.props.ExperimentActions.CreateNewWorkspace({
        title: experimentType,
        type: experimentType,
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
    this.props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
    });
    this.props.history.push(SCREENS.DESIGN.route);
  }

  // Load recent workspace by copying saved 'experiment' redux state into current redux state
  handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = readAndParseState(dir);
    if (!isNil(recentWorkspaceState)) {
      this.props.ExperimentActions.SetState(recentWorkspaceState);
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

  async handleDeleteWorkspace(dir) {
    const options = {
      buttons: ['No', 'Yes'],
      message: 'Do you really want to delete the experiment?',
    };
    const response = await dialog.showMessageBox(options);
    if (response.response === 1) {
      deleteWorkspaceDir(dir);
      this.setState({ recentWorkspaces: readWorkspaces() });
    }
  }

  // TODO: Figure out how to make this not overflow when there's tons of workspaces. Lists?
  renderSectionContent() {
    switch (this.state.activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <Grid
            stackable
            padded
            columns="equal"
            className={styles.myExperimentsPage}
          >
            {this.state.recentWorkspaces.length > 0 ? (
              <Table basic="very">
                <Table.Header>
                  <Table.Row className={styles.experimentHeaderRow}>
                    <Table.HeaderCell className={styles.experimentHeaderName}>
                      Experiment name
                    </Table.HeaderCell>
                    <Table.HeaderCell>Date Last Opened</Table.HeaderCell>
                    <Table.HeaderCell
                      className={styles.experimentHeaderActionsName}
                    >
                      Actions
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body className={styles.experimentTable}>
                  {this.state.recentWorkspaces
                    .sort((a, b) => {
                      const aState = readAndParseState(a);
                      const bState = readAndParseState(b);

                      const aTime = aState?.dateModified || 0;
                      const bTime = bState?.dateModified || 0;

                      return bTime - aTime;
                    })
                    .map((dir) => {
                      const workspaceState = readAndParseState(dir);
                      console.log(workspaceState);
                      if (!workspaceState) {
                        return undefined;
                      }
                      const dateModified = workspaceState.dateModified;
                      return (
                        <Table.Row key={dir} className={styles.experimentRow}>
                          <Table.Cell className={styles.experimentRowName}>
                            {dir}
                          </Table.Cell>
                          <Table.Cell className={styles.experimentRowName}>
                            {dateModified &&
                              moment.default(dateModified).fromNow()}
                          </Table.Cell>
                          <Table.Cell className={styles.experimentRowName}>
                            <Button
                              secondary
                              onClick={() => this.handleDeleteWorkspace(dir)}
                            >
                              Delete
                            </Button>
                            <Button
                              secondary
                              onClick={() => openWorkspaceDir(dir)}
                            >
                              Go to Folder
                            </Button>
                            <Button
                              primary
                              onClick={() =>
                                this.handleLoadRecentWorkspace(dir)
                              }
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
              <Grid.Column textAlign="center">
                <Image
                  src={divingMan}
                  centered
                  className={styles.noExperimentsImage}
                />
                <Header className={styles.noExperimentsTitle}>
                  You don&apos;t have any experiments yet
                </Header>
                <p className={styles.noExperimentsText}>
                  Head over to the &quot;Experiment Bank&quot; section to start
                  an experiment.
                </p>
                <Button
                  primary
                  onClick={() => this.handleStepClick('EXPERIMENT BANK')}
                >
                  View Experiments
                </Button>
              </Grid.Column>
            )}
          </Grid>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <Grid columns="two" relaxed padded>
            <Grid.Row>
              <Grid.Column>
                <ExperimentCard
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
                  icon={faceHouseIcon}
                  title="Faces/Houses"
                  description={`Explore how people react to different kinds of
                            images, like faces vs. houses.`}
                />
              </Grid.Column>

              <Grid.Column>
                <ExperimentCard
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
                  icon={stroopIcon}
                  title="Stroop"
                  description={`Investigate why it is hard to deal with
                            contradictory information (like the word "RED"
                            printed in blue).`}
                />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <ExperimentCard
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.MULTI)}
                  icon={multitaskingIcon}
                  title="Multi-tasking"
                  description={`Explore why it is challenging to carry out multiple
                            tasks at the same time.`}
                />
              </Grid.Column>

              <Grid.Column>
                <ExperimentCard
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.SEARCH)}
                  icon={searchIcon}
                  title="Visual Search"
                  description={`Examine why it is difficult to find your keys in a
                            messy room.`}
                />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <ExperimentCard
                  onClick={() => this.handleNewExperiment(EXPERIMENTS.CUSTOM)}
                  icon={customIcon}
                  title="Custom"
                  description="Design your own experiment!"
                />
              </Grid.Column>

              <Grid.Column />
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
            DeviceActions={this.props.DeviceActions}
          />
        );
    }
  }

  renderOverviewOrHome() {
    if (this.state.isOverviewComponentOpen) {
      return (
        <OverviewComponent
          type={this.state.overviewExperimentType}
          onStartExperiment={this.handleNewExperiment}
          onCloseOverview={this.handleCloseOverview}
        />
      );
    }
    return (
      <>
        <SecondaryNavComponent
          title={<Image src={appLogo} />}
          steps={HOME_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
        />
        <div className={styles.homeContentContainer}>
          {this.renderSectionContent()}
        </div>
      </>
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
