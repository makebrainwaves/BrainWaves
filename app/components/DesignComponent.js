// @flow
import React, { Component } from "react";
import { Grid, Button, Step, Segment, Header, Image } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./styles/common.css";
import { EXPERIMENTS } from "../constants/constants";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";
import faceHouseIcon from "../assets/face_house/face_house_icon.jpg";

const DESIGN_STEPS = { OVERVIEW: 0, BACKGROUND: 1, PROTOCOL: 2 };

interface Props {
  type: ?EXPERIMENTS;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  experimentActions: Object;
}

interface State {
  activeStep: number;
}

export default class Design extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: (Object, Object) => void;
  handleStartExperiment: Object => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
  }

  handleStepClick(e: Object, props: Object) {
    this.setState({ activeStep: props.title });
  }

  handleStartExperiment(e: Object) {
    if (isNil(this.props.type)) {
      e.preventDefault();
    }
  }

  render() {
    return (
      <div>
        <div className={styles.mainContainer}>
          <Grid columns={1} centered style={{ height: "50%" }}>
            <Grid.Row>
              <Segment raised color="red">
                <Header as="h3">Review Design</Header>
                <Step.Group>
                  <Step
                    link
                    title="Overview"
                    active={this.state.activeStep === "Overview"}
                    onClick={this.handleStepClick}
                  />
                  <Step
                    link
                    disabled
                    title="Background"
                    active={this.state.activeStep === "Background"}
                    onClick={this.handleStepClick}
                  />
                  <Step
                    link
                    disabled
                    title="Experimental Protocol"
                    active={this.state.activeStep === "Experimental Protocol"}
                    onClick={this.handleStepClick}
                  />
                </Step.Group>
              </Segment>
            </Grid.Row>
            <Grid.Row stretched style={{ height: "100%" }}>
              <Segment padded="very" compact raised color="red">
                <Grid columns={2}>
                  <Grid.Column>
                    <Segment basic>
                      <Header as="h1">{this.props.type}</Header>
                    </Segment>
                    <Segment basic>
                      <Link
                        to="/deviceConnect"
                        onClick={this.handleStartExperiment}
                      >
                        <Button color="red">Begin Experiment</Button>
                      </Link>
                    </Segment>
                  </Grid.Column>
                  <Grid.Column textAlign="left">
                    <Segment basic>
                      <Image src={faceHouseIcon} size="medium" />
                    </Segment>
                    <p>
                      An event-related potential, or ERP, is the
                      electrophysiological response in the brain to a specific
                      motor or cognitive event (e.g. a stimulus). This stimulus
                      can be almost anything: a flashing light, a surprising
                      sound, a blinking eyeld etc. In all cases, a bci using
                      ERP’s will try to isolate and identify these small,
                      event-related responses.
                    </p>
                    <p>
                      This experiment will explore the N170 ERP that is produce
                      in response to viewing faces (as compared to non human
                      objects). It is called the N170 because it is a negative
                      deflection that occurs around 170ms after perceiving a
                      face
                    </p>
                  </Grid.Column>
                </Grid>
              </Segment>
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
