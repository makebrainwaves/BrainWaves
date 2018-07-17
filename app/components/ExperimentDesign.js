// @flow
import React, { Component } from "react";
import { Grid, Button, Icon, Step, Segment, Header } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./ExperimentDesign.css";
import { EXPERIMENTS } from "../constants/constants";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";

interface Props {
  type: ?EXPERIMENTS;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  experimentActions: Object;
}

interface State {
  activeStep: string;
}

export default class ExperimentDesign extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      activeStep: "Overview"
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
        <div className={styles.experimentContainer}>
          <Link to="/" className={styles.homeButton}>
            <Icon name="home" size="large" color="black" inverted />
          </Link>
          <Grid columns={1} centered style={{ height: "50%" }}>
            <Grid.Row>
              <Segment raised color="purple">
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
              <Segment padded="very" compact raised color="purple">
                <Grid columns={2}>
                  <Grid.Column>
                    <Header as="h3">{this.props.type}</Header>
                    <Link
                      to="/deviceConnect"
                      onClick={this.handleStartExperiment}
                    >
                      <Button color="purple">Begin Experiment</Button>
                    </Link>
                  </Grid.Column>
                  <Grid.Column>
                    <p>
                      Faces contain a lot of important information that is
                      relevant to our survival.
                    </p>
                    <p>
                      It is important to be able to quickly recognize people you
                      can trust and read emotions in both strangers and people
                      you know.
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
