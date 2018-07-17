// @flow
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Grid, Button, Header, Segment, List, Image } from "semantic-ui-react";
import styles from "./Home.css";
import { EXPERIMENTS } from "../constants/constants";

interface Props {
  jupyterActions: Object;
  deviceActions: Object;
  experimentActions: Object;
  rawObservable: ?any;
  client: ?any;
  mainChannel: ?any;
}

export default class Home extends Component<Props> {
  props: Props;

  handleExperimentSelect(experimentType: EXPERIMENTS) {
    this.props.experimentActions.setType(experimentType);
    this.props.experimentActions.loadDefaultTimeline();
  }

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <Grid columns={2} relaxed padded>
            <Grid.Row>
              <Grid.Column>
                <Segment raised color="purple">
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
                <Segment color="purple">
                  <Header as="h3">Start Experiment</Header>
                  <List size="medium">
                    <List.Item>
                      <Link
                        to="/experimentDesign"
                        onClick={() =>
                          this.handleExperimentSelect(EXPERIMENTS.N170)
                        }
                      >
                        <Image
                          size="small"
                          src="./assets/face_house/face_house_icon.jpg"
                        />
                        <List.Content
                          header="Faces and Houses"
                          description="Detecting the N170 face-evoked potential"
                        />
                      </Link>
                    </List.Item>
                  </List>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}
