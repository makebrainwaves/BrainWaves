// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Step,
  Segment,
  Header,
  Image,
  List
} from "semantic-ui-react";
import { isNil } from "lodash";
import styles from "../styles/common.css";
import { EXPERIMENTS } from "../../constants/constants";
import { MainTimeline, Trial, Timeline } from "../../constants/interfaces";
import PreviewExperimentComponent from "../PreviewExperimentComponent";
import faceHouseIcon from "../../assets/face_house/face_house_icon.jpg";
import n170Example from "../../assets/face_house/n170_example.png";

const DESIGN_STEPS = {
  OVERVIEW: "Overview",
  BACKGROUND: "Background",
  PROTOCOL: "Experimental Protocol"
};

interface Props {
  type: ?EXPERIMENTS;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  experimentActions: Object;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
}

export default class Design extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: (Object, Object) => void;
  handleStartExperiment: Object => void;
  handlePreview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW,
      isPreviewing: false
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
  }

  handleStepClick(e: Object, props: Object) {
    this.setState({ activeStep: props.title });
  }

  handleStartExperiment(e: Object) {
    if (isNil(this.props.type)) {
      e.preventDefault();
    }
  }

  handlePreview() {
    if (isNil(this.props.mainTimeline)) {
      this.props.experimentActions.loadDefaultTimeline();
    }
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  renderPreviewButton() {
    if (!this.state.isPreviewing) {
      return (
        <Button secondary onClick={this.handlePreview}>
          Preview Experiment
        </Button>
      );
    }
    return (
      <Button negative onClick={this.handlePreview}>
        Stop Preview
      </Button>
    );
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case DESIGN_STEPS.BACKGROUND:
        return (
          <Segment basic>
            <Image src={n170Example} floated="left" size="large" />
            <p>
              The N170 is a large negative event-related potential (ERP)
              component that occurs after the detection of faces, but not
              objects, scrambled faces, or other body parts such as hands. The
              N170 occurs around 170ms after face perception and is most easily
              detected at lateral posterior electrodes such as T5 and T6.
              Frontal or profile views of human (and animal) faces elicit the
              strongest N170 and the strength of the N170 does not seem to be
              influenced by how familiar a face is. Thus, although there is no
              consensus on the specific source of the N170, researchers believe
              it is related to activity in the fusiform face area, an area of
              the brain that shows a similar response pattern and is involved in
              encoding the holistic representation of a face (i.e eyes, nose
              mouth all arranged in the appropriate way).
            </p>
          </Segment>
        );
      case DESIGN_STEPS.PROTOCOL:
        return (
          <Grid stretched>
            <Grid.Column width={6} textAlign="center">
              <Segment basic padded>
                <PreviewExperimentComponent
                  isPreviewing={this.state.isPreviewing}
                  mainTimeline={this.props.mainTimeline}
                  trials={this.props.trials}
                  timelines={this.props.timelines}
                />
              </Segment>
            </Grid.Column>
            <Grid.Column width={10}>
              <Segment basic>
                <List relaxed ordered>
                  <List.Item>
                    Connect EEG device and put subject in a quiet area free from
                    distraction
                  </List.Item>
                  <List.Item>
                    EEG device should be adjusted to obtain high signal quality
                  </List.Item>
                  <List.Item>
                    Subject will view a series of images of faces and houses for
                    120 seconds
                  </List.Item>
                  <List.Item>
                    While keeping face and body relaxed, subject should mentally
                    note which stimulus they are perceiving
                  </List.Item>
                  <List.Item>
                    Experiment should be repeated 4-6 times to maximise the
                    amount of data collected
                  </List.Item>
                  <List.Item>
                    EEG data will be filtered and segmented into epochs
                    immediately around viewing faces and houses
                  </List.Item>
                  <List.Item>
                    Face and House epochs will be averaged to display the
                    typical waveform and reveal ERPs
                  </List.Item>
                </List>
                {this.renderPreviewButton()}
              </Segment>
            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <Segment basic>
            <Image src={faceHouseIcon} size="medium" />
            <p>
              An event-related potential, or ERP, is the electrophysiological
              response in the brain to a specific motor or cognitive event (e.g.
              a stimulus). This stimulus can be almost anything: a flashing
              light, a surprising sound, a blinking eyeld etc. In all cases, a
              bci using ERP’s will try to isolate and identify these small,
              event-related responses.
            </p>
            <p>
              This experiment will explore the N170 ERP that is produce in
              response to viewing faces (as compared to non human objects). It
              is called the N170 because it is a negative deflection that occurs
              around 170ms after perceiving a face
            </p>
          </Segment>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <Grid columns={1} centered style={{ height: "50%" }}>
          <Grid.Row>
            <Segment raised color="red">
              <Header as="h3">Review Design</Header>
              <Step.Group>
                <Step
                  link
                  title={DESIGN_STEPS.OVERVIEW}
                  active={this.state.activeStep === DESIGN_STEPS.OVERVIEW}
                  onClick={this.handleStepClick}
                />
                <Step
                  link
                  title={DESIGN_STEPS.BACKGROUND}
                  active={this.state.activeStep === DESIGN_STEPS.BACKGROUND}
                  onClick={this.handleStepClick}
                />
                <Step
                  link
                  title={DESIGN_STEPS.PROTOCOL}
                  active={this.state.activeStep === DESIGN_STEPS.PROTOCOL}
                  onClick={this.handleStepClick}
                />
              </Step.Group>
            </Segment>
          </Grid.Row>
          <Grid.Row stretched style={{ height: "100%" }}>
            <Segment raised className={styles.mainSegment} color="red">
              {this.renderSectionContent()}
            </Segment>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}
