// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import {
  Grid,
  Button,
  Header,
  Segment,
  List,
  Image,
  Modal,
  Step
} from "semantic-ui-react";
import styles from "./styles/common.css";
import { EXPERIMENTS, SCREENS } from "../constants/constants";

import faceHouseIcon from "../assets/face_house/face_house_icon.jpg";
import {
  readWorkspacesDir,
  readAndParseState
} from "../utils/filesystem/storage";
import InputModal from "./unused/InputModal";

const HOME_STEPS = {
  RECENT: "RECENT",
  NEW: "NEW EXPERIMENT",
  PRACTICE: "PRACTICE"
};

interface Props {
  jupyterActions: Object;
  deviceActions: Object;
  experimentActions: Object;
  rawObservable: ?any;
  mainChannel: ?any;
}

interface State {
  activeStep: string;
  recentWorkspaces: Array<string>;
  isNewExperimentModalOpen: boolean;
  selectedExperimentType: EXPERIMENTS;
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleNewExperiment: EXPERIMENTS => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.RECENT,
      recentWorkspaces: [],
      isNewExperimentModalOpen: false,
      selectedExperimentType: EXPERIMENTS.NONE
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleNewExperiment = this.handleNewExperiment.bind(this);
    this.handleLoadNewExperiment = this.handleLoadNewExperiment.bind(this);
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspacesDir() });
  }

  handleStepClick(e: Object, props: Object) {
    this.setState({ activeStep: props.title });
  }

  handleNewExperiment(experimentType: EXPERIMENTS) {
    this.setState({
      isNewExperimentModalOpen: true,
      selectedExperimentType: experimentType
    });
  }

  handleLoadNewExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    this.props.experimentActions.setType(this.state.selectedExperimentType);
    this.props.experimentActions.setTitle(title);
    this.props.experimentActions.loadDefaultTimeline();
  }

  // handleExperimentSelect(experimentType: EXPERIMENTS) {
  //   this.props.experimentActions.setType(experimentType);
  //   if (experimentType === EXPERIMENTS.CUSTOM) {
  //     this.props.experimentActions.loadDefaultTimeline();
  //     this.props.experimentActions.setTitle("Dano custom experiment");
  //     this.props.experimentActions.setSubject("Dano");
  //     this.props.experimentActions.setSession(5);
  //   } else {
  //     this.props.experimentActions.loadDefaultTimeline();
  //   }
  // }

  handleLoadRecentWorkspace(dir: string) {
    this.props.experimentActions.setState(readAndParseState(dir));
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <div>
            {this.state.recentWorkspaces.map((dir, index) => (
              <Segment key={dir} basic>
                <Button
                  secondary
                  onClick={() => this.handleLoadRecentWorkspace(dir)}
                >
                  Open Workspace
                </Button>
                {dir}
              </Segment>
            ))}
          </div>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <Grid columns={2} relaxed padded>
            <Grid.Row>
              <Grid.Column>
                <Segment raised color="red">
                  <Header as="h2">Welcome to the BrainWaves App Alpha</Header>
                  <p>
                    The New York University (NYU) BrainWaves app allows you to
                    learn to design and carry out original brain experiments
                    using real brainwave scanning equipment in the classroom.
                  </p>
                  <p>
                    Get started by choosing to practice a new skill, start an
                    experiment, or pick up where you left off with a past
                    workspace.
                  </p>
                </Segment>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Segment color="red">
                  <Header as="h3">Faces and Houses</Header>
                  <Image size="small" src={faceHouseIcon} />
                  "Detecting the N170 face-evoked potential"
                  <Button
                    secondary
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.N170)}
                  >
                    Start New Experiment
                  </Button>
                </Segment>
                <Segment color="red">
                  <Header as="h3">Custom</Header>
                  <Image size="small" src={faceHouseIcon} />
                  Build your own neuroscience experiment!
                  <Button
                    secondary
                    onClick={() => this.handleNewExperiment(EXPERIMENTS.CUSTOM)}
                  >
                    Start New Experiment
                  </Button>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer} data-tid="container">
        <Segment raised color="red">
          <Step.Group>
            <Step
              link
              title={HOME_STEPS.RECENT}
              active={this.state.activeStep === HOME_STEPS.RECENT}
              onClick={this.handleStepClick}
            />
            <Step
              link
              title={HOME_STEPS.NEW}
              active={this.state.activeStep === HOME_STEPS.NEW}
              onClick={this.handleStepClick}
            />
          </Step.Group>
        </Segment>
        {this.renderSectionContent()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadNewExperiment}
          placeholder={this.state.selectedExperimentType}
          header="Please enter a title for this experiment"
        />
      </div>
    );
  }
}
