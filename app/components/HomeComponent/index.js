// @flow
import React, { Component } from "react";
import { isNil } from "lodash";
import { Grid, Button, Header, Segment, Image } from "semantic-ui-react";
import { toast } from "react-toastify";
import styles from "../styles/common.css";
import { EXPERIMENTS, SCREENS, KERNEL_STATUS } from "../../constants/constants";
import faceHouseIcon from "../../assets/common/FacesHouses.png";
import stroopIcon from "../../assets/common/Stroop.png";
import multitaskingIcon from "../../assets/common/Multitasking.png";
import searchIcon from "../../assets/common/VisualSearch.png";
import customIcon from "../../assets/common/Custom.png";
import appLogo from "../../assets/common/app_logo.png";
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir
} from "../../utils/filesystem/storage";
import {
  Collect,
  Props as CollectProps,
  State as CollectState
} from "../CollectComponent";
import InputModal from "../InputModal";
import SecondaryNavComponent from "../SecondaryNavComponent";
import OverviewComponent from "./OverviewComponent";
import { loadTimeline } from "../../utils/jspsych/functions";
import SignalQualityIndicatorComponent from "../SignalQualityIndicatorComponent";
import ViewerComponent from "../ViewerComponent";
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from "../../constants/constants";
import ConnectModal from "../CollectComponent/ConnectModal";

const HOME_STEPS = {
  // TODO: maybe change the recent and new labels, but not necessary right now
  RECENT: "MY EXPERIMENTS",
  NEW: "EXPERIMENT BANK",
  EXPLORE: "EXPLORE EEG DATA"
};

interface Props {
  kernelStatus: KERNEL_STATUS;
  history: Object;
  jupyterActions: Object;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  availableDevices: Array<any>;
  experimentActions: Object;
}

interface State {
  activeStep: string;
  recentWorkspaces: Array<string>;
  isNewExperimentModalOpen: boolean;
  isOverviewComponentOpen: boolean;
  overviewExperimentType: EXPERIMENTS;
  isConnectModalOpen: boolean;
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleNewExperiment: EXPERIMENTS => void;
  handleStepClick: string => void;
  handleLoadCustomExperiment: string => void;
  handleOpenOverview: EXPERIMENTS => void;
  handleCloseOverview: () => void;
  handleConnectModalClose: () => void;
  handleStartConnect: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.NEW,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      isOverviewComponentOpen: false,
      overviewExperimentType: EXPERIMENTS.NONE,
      isConnectModalOpen: false
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(
      this
    );
    this.handleOpenOverview = this.handleOpenOverview.bind(this);
    this.handleCloseOverview = this.handleCloseOverview.bind(this);
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleStopConnect = this.handleStopConnect.bind(this);
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspaces() });
  }

  componentDidUpdate = (prevProps: Props, prevState: State) => {
    if (
      this.props.connectionStatus === CONNECTION_STATUS.CONNECTED &&
      prevState.isConnectModalOpen
    ) {
      this.setState({ isConnectModalOpen: false });
    }
  };

  handleStartConnect() {
    this.setState({ isConnectModalOpen: true });
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleStopConnect() {
    this.props.deviceActions.disconnectFromDevice(this.props.connectedDevice);
    this.setState({ isConnectModalOpen: false });
    this.props.deviceActions.setDeviceAvailability(DEVICE_AVAILABILITY.NONE);
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

  handleConnectModalClose() {
    this.setState({ isConnectModalOpen: false });
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
                      <Grid.Column
                        width={4}
                        className={styles.experimentCardImage}
                      >
                        <Image src={faceHouseIcon} />
                      </Grid.Column>
                      <Grid.Column
                        width={12}
                        className={styles.descriptionContainer}
                      >
                        <Header as="h1" className={styles.experimentCardHeader}>
                          Faces/Houses
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Explore how people react to different kinds of
                            images, like faces vs. houses.
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
                      <Grid.Column
                        width={4}
                        className={styles.experimentCardImage}
                      >
                        <Image src={stroopIcon} />
                      </Grid.Column>
                      <Grid.Column
                        width={12}
                        className={styles.descriptionContainer}
                      >
                        <Header as="h1" className={styles.experimentCardHeader}>
                          Stroop
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Investigate why it is hard to deal with
                            contradictory information (like the word "RED"
                            printed in blue).
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
                      <Grid.Column
                        width={4}
                        className={styles.experimentCardImage}
                      >
                        <Image src={multitaskingIcon} />
                      </Grid.Column>
                      <Grid.Column
                        width={12}
                        className={styles.descriptionContainer}
                      >
                        <Header as="h1" className={styles.experimentCardHeader}>
                          Multi-tasking
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Explore why it is challenging to carry out multiple
                            tasks at the same time.
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
                      <Grid.Column
                        width={4}
                        className={styles.experimentCardImage}
                      >
                        <Image src={searchIcon} />
                      </Grid.Column>
                      <Grid.Column
                        width={12}
                        className={styles.descriptionContainer}
                      >
                        <Header as="h1" className={styles.experimentCardHeader}>
                          Visual Search
                        </Header>
                        <div className={styles.experimentCardDescription}>
                          <p>
                            Examine why it is difficult to find your keys in a
                            messy room.
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
      case HOME_STEPS.EXPLORE:
        return (
          <Grid stackable padded columns="equal">
            {this.props.connectionStatus === CONNECTION_STATUS.CONNECTED && (
              <Grid divided="vertically">
                <Grid.Row columns={1}>
                  <Grid.Column>
                    <Button primary onClick={this.handleStopConnect}>
                      Disconnect EEG Device
                    </Button>
                  </Grid.Column>
                </Grid.Row>
                ,
                <Grid.Row>
                  <Grid.Column stretched width={6}>
                    <SignalQualityIndicatorComponent
                      signalQualityObservable={
                        this.props.signalQualityObservable
                      }
                      plottingInterval={PLOTTING_INTERVAL}
                    />
                  </Grid.Column>
                  <Grid.Column stretched width={10}>
                    <ViewerComponent
                      signalQualityObservable={
                        this.props.signalQualityObservable
                      }
                      deviceType={this.props.deviceType}
                      plottingInterval={PLOTTING_INTERVAL}
                    />
                    {/* {this.renderHelpButton()} */}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            )}
            {this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED && (
              <Grid.Row>
                <ConnectModal
                  history={this.props.history}
                  open={this.state.isConnectModalOpen}
                  onClose={this.handleConnectModalClose}
                  connectedDevice={this.props.connectedDevice}
                  signalQualityObservable={this.props.signalQualityObservable}
                  deviceType={this.props.deviceType}
                  deviceAvailability={this.props.deviceAvailability}
                  connectionStatus={this.props.connectionStatus}
                  deviceActions={this.props.deviceActions}
                  availableDevices={this.props.availableDevices}
                  style={{ marginTop: "100px" }}
                />
                <Grid.Column>
                  <Button primary onClick={this.handleStartConnect}>
                    Connect EEG Device
                  </Button>
                </Grid.Column>
                <Grid.Column>Please click the button on the left to connect to your EEG device.</Grid.Column>
              </Grid.Row>
            )}
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
