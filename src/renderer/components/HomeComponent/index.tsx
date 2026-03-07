import React, { Component } from 'react';
import { isNil } from 'lodash';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { Observable } from 'rxjs';
import styles from '../styles/common.module.css';
import {
  EXPERIMENTS,
  SCREENS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import faceHouseIcon from '../../experiments/faces_houses/icon.png';
import stroopIcon from '../../experiments/stroop/icon.png';
import multitaskingIcon from '../../experiments/multitasking/icon.png';
import searchIcon from '../../experiments/search/icon.png';
// import customIcon from '../../experiments/custom/icon.png';
import appLogo from '../../assets/common/app_logo.png';
import divingMan from '../../assets/common/divingMan.svg';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
} from '../../utils/filesystem/storage';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import {
  PyodideActions,
  DeviceActions,
  ExperimentActions,
} from '../../actions';
import { ExperimentCard } from './ExperimentCard';
import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';
import EEGExplorationComponent from '../EEGExplorationComponent';
import { SignalQualityData } from '../../constants/interfaces';
import { getExperimentFromType } from '../../utils/labjs/functions';
import PyodidePlotWidget from '../PyodidePlotWidget';

const HOME_STEPS = {
  // TODO: maybe change the recent and new labels, but not necessary right now
  RECENT: 'MY EXPERIMENTS',
  NEW: 'EXPERIMENT BANK',
  EXPLORE: 'EXPLORE EEG DATA',
  PYODIDE_TEST: 'PYODIDE_TEST',
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
  navigate: (path: string) => void;
  PyodideActions: typeof PyodideActions;
  signalQualityObservable?: Observable<SignalQualityData>;
  topoPlot: {
    [key: string]: string;
  };
}

interface State {
  activeStep: string;
  isNewExperimentModalOpen: boolean;
  isOverviewComponentOpen: boolean;
  recentWorkspaces: Array<string>;
  overviewExperimentType: EXPERIMENTS;
  workspaceStates: Record<string, ExperimentStateType | null>;
}

export default class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: this.props.activeStep || HOME_STEPS.RECENT,
      recentWorkspaces: [],
      workspaceStates: {},
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      overviewExperimentType: EXPERIMENTS.NONE,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadCustomExperiment =
      this.handleLoadCustomExperiment.bind(this);
    this.handleOpenOverview = this.handleOpenOverview.bind(this);
    this.handleCloseOverview = this.handleCloseOverview.bind(this);
    this.handleDeleteWorkspace = this.handleDeleteWorkspace.bind(this);
  }

  async componentDidMount() {
    this.props.PyodideActions.Launch();
    const recentWorkspaces = await readWorkspaces();
    this.setState({ recentWorkspaces });
    await this.loadWorkspaceStates(recentWorkspaces);
  }

  async loadWorkspaceStates(workspaces: string[]) {
    const entries = await Promise.all(
      workspaces.map(async (dir) => [dir, await readAndParseState(dir)] as const)
    );
    this.setState({
      workspaceStates: Object.fromEntries(entries),
    });
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
      this.props.navigate(SCREENS.DESIGN.route);
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
    this.props.navigate(SCREENS.DESIGN.route);
  }

  // Load recent workspace by copying saved 'experiment' redux state into current redux state
  async handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState == null) {
      toast.error(
        'Workspace data is corrupted or missing. Please delete and create it again.'
      );
      return;
    }

    // This is a stop-gap solution until our lab.js experiment definitions for built-in experiments are fully serializable
    // Returns an appropriate default experiment object complete with initialization functions
    const deserializedWorkspaceState = {
      ...recentWorkspaceState,
      experimentObject: getExperimentFromType(recentWorkspaceState.type)
        .experimentObject,
    };
    this.props.ExperimentActions.SetState(deserializedWorkspaceState as any);
    this.props.navigate(SCREENS.DESIGN.route);
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
    const response = await window.electronAPI.showMessageBox(options);
    if (response.response === 1) {
      deleteWorkspaceDir(dir);
      const recentWorkspaces = await readWorkspaces();
      this.setState({ recentWorkspaces });
      await this.loadWorkspaceStates(recentWorkspaces);
    }
  }

  // TODO: Figure out how to make this not overflow when there's tons of workspaces. Lists?
  renderSectionContent() {
    switch (this.state.activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <div className={styles.myExperimentsPage}>
            {this.state.recentWorkspaces.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className={styles.experimentHeaderRow}>
                    <TableHead className={styles.experimentHeaderName}>
                      Experiment name
                    </TableHead>
                    <TableHead>Date Last Opened</TableHead>
                    <TableHead className={styles.experimentHeaderActionsName}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className={styles.experimentTable}>
                  {this.state.recentWorkspaces
                    .sort((a, b) => {
                      const aState = this.state.workspaceStates[a];
                      const bState = this.state.workspaceStates[b];

                      const aTime = aState?.dateModified || 0;
                      const bTime = bState?.dateModified || 0;

                      return bTime - aTime;
                    })
                    .map((dir) => {
                      const workspaceState = this.state.workspaceStates[dir];
                      if (!workspaceState) {
                        return undefined;
                      }
                      const { dateModified } = workspaceState;
                      return (
                        <TableRow key={dir} className={styles.experimentRow}>
                          <TableCell className={styles.experimentRowName}>
                            {dir}
                          </TableCell>
                          <TableCell className={styles.experimentRowName}>
                            {dateModified && dayjs(dateModified).fromNow()}
                          </TableCell>
                          <TableCell className={styles.experimentRowName}>
                            <Button
                              variant="secondary"
                              onClick={() => this.handleDeleteWorkspace(dir)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => openWorkspaceDir(dir)}
                            >
                              Go to Folder
                            </Button>
                            <Button
                              variant="default"
                              onClick={() =>
                                this.handleLoadRecentWorkspace(dir)
                              }
                            >
                              Open Experiment
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center">
                <img
                  src={divingMan}
                  className={styles.noExperimentsImage}
                  alt="No experiments"
                />
                <h2 className={styles.noExperimentsTitle}>
                  You don&apos;t have any experiments yet
                </h2>
                <p className={styles.noExperimentsText}>
                  Head over to the &quot;Experiment Bank&quot; section to start
                  an experiment.
                </p>
                <Button
                  variant="default"
                  onClick={() => this.handleStepClick('EXPERIMENT BANK')}
                >
                  View Experiments
                </Button>
              </div>
            )}
          </div>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            <ExperimentCard
              onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
              icon={faceHouseIcon}
              title="Faces/Houses"
              description={`Explore how people react to different kinds of
                        images, like faces vs. houses.`}
            />
            <ExperimentCard
              onClick={() => this.handleNewExperiment(EXPERIMENTS.STROOP)}
              icon={stroopIcon}
              title="Stroop"
              description={`Investigate why it is hard to deal with
                        contradictory information (like the word "RED"
                        printed in blue).`}
            />
            <ExperimentCard
              onClick={() => this.handleNewExperiment(EXPERIMENTS.MULTI)}
              icon={multitaskingIcon}
              title="Multi-tasking"
              description={`Explore why it is challenging to carry out multiple
                        tasks at the same time.`}
            />
            <ExperimentCard
              onClick={() => this.handleNewExperiment(EXPERIMENTS.SEARCH)}
              icon={searchIcon}
              title="Visual Search"
              description={`Examine why it is difficult to find your keys in a
                        messy room.`}
            />
          </div>
        );
      case HOME_STEPS.EXPLORE:
        return (
          <EEGExplorationComponent
            connectedDevice={this.props.connectedDevice}
            signalQualityObservable={this.props.signalQualityObservable}
            deviceType={this.props.deviceType}
            deviceAvailability={this.props.deviceAvailability}
            connectionStatus={this.props.connectionStatus}
            availableDevices={this.props.availableDevices}
            DeviceActions={this.props.DeviceActions}
          />
        );
      case HOME_STEPS.PYODIDE_TEST:
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <Button variant="default" onClick={() => this.props.PyodideActions.LoadTopo()}>
                Generate Plot
              </Button>
            </div>
            <div>
              <PyodidePlotWidget
                title={'Test Plot'}
                imageTitle={`Test-Topoplot`}
                plotMIMEBundle={this.props.topoPlot}
              />
            </div>
          </div>
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
          title={<img src={appLogo} alt="BrainWaves" />}
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
