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
  Step
} from "semantic-ui-react";
import styles from "./styles/common.css";
import { EXPERIMENTS, SCREENS } from "../constants/constants";
import faceHouseIcon from "../assets/face_house/face_house_icon.jpg";
import {
  readWorkspacesDir,
  readAndParseState
} from "../utils/filesystem/storage";

const HOME_STEPS = {
  RECENT: "RECENT",
  PRE_DESIGNED: "PRE-DESIGNED EXPERIMENTS",
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
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: HOME_STEPS.PRE_DESIGNED,
      recentWorkspaces: []
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleExperimentSelect = this.handleExperimentSelect.bind(this);
  }

  componentDidMount() {
    this.setState({ recentWorkspaces: readWorkspacesDir() });
  }

  handleStepClick(e: Object, props: Object) {
    this.setState({ activeStep: props.title });
  }

  handleExperimentSelect(experimentType: EXPERIMENTS) {
    this.props.experimentActions.setType(experimentType);
    if (experimentType === EXPERIMENTS.CUSTOM) {
      this.props.experimentActions.loadDefaultTimeline();
      this.props.experimentActions.setTitle("Dano custom experiment");
      this.props.experimentActions.setSubject("Dano");
      this.props.experimentActions.setSession(5);
    } else {
      this.props.experimentActions.loadDefaultTimeline();
    }
  }

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
      case HOME_STEPS.PRE_DESIGNED:
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
                  <List size="medium">
                    <List.Item>
                      <Link
                        to={SCREENS.DESIGN.route}
                        onClick={() =>
                          this.handleExperimentSelect(EXPERIMENTS.N170)
                        }
                      >
                        <Image size="small" src={faceHouseIcon} />
                        <List.Content description="Detecting the N170 face-evoked potential" />
                      </Link>
                    </List.Item>
                  </List>
                </Segment>
                <Segment color="red">
                  <Header as="h3">Custom</Header>
                  <List size="medium">
                    <List.Item>
                      <Image size="small" src={faceHouseIcon} />
                      <List.Content description="Build your own neuroscience experiment!" />
                      <Link to={SCREENS.DESIGN.route}>
                        <Button
                          secondary
                          onClick={() =>
                            this.handleExperimentSelect(EXPERIMENTS.CUSTOM)
                          }
                        >
                          Review
                        </Button>
                      </Link>
                    </List.Item>
                  </List>
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
              title={HOME_STEPS.PRE_DESIGNED}
              active={this.state.activeStep === HOME_STEPS.PRE_DESIGNED}
              onClick={this.handleStepClick}
            />
          </Step.Group>
        </Segment>
        {this.renderSectionContent()}
      </div>
    );
  }
}
