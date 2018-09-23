// @flow
import React, { Component } from 'react';
import { Grid, Button, Segment, Header } from 'semantic-ui-react';
import { isNil } from 'lodash';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';

const DESIGN_STEPS = {
  OVERVIEW: 'Overview',
  BACKGROUND: 'Background',
  PROTOCOL: 'Experimental Protocol'
};

interface Props {
  history: Object;
  type: ?EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
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

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
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
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
            >
              <Header as="h1">The N170 ERP</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment as="p" basic>
                The N170 is a large negative event-related potential (ERP)
                component that occurs after the detection of faces, but not
                objects, scrambled faces, or other body parts such as hands. The
                N170 occurs around 170ms after face perception and is most
                easily detected at lateral posterior electrodes such as T5 and
                T6. Frontal or profile views of human (and animal) faces elicit
                the strongest N170 and the strength of the N170 does not seem to
                be influenced by how familiar a face is. Thus, although there is
                no consensus on the specific source of the N170, researchers
                believe it is related to activity in the fusiform face area, an
                area of the brain that shows a similar response pattern and is
                involved in encoding the holistic representation of a face (i.e
                eyes, nose mouth all arranged in the appropriate way).
              </Segment>
            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.PROTOCOL:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
            >
              <PreviewExperimentComponent
                params={this.props.params}
                mainTimeline={this.props.mainTimeline}
                trials={this.props.trials}
                timelines={this.props.timelines}
                isPreviewing={this.state.isPreviewing}
              />
            </Grid.Column>
            <Grid.Column width={6} verticalAlign="middle">
              <Segment as="p" basic>
                Subjects will view a series of images of{' '}
                <b> faces and houses</b> for <b>120 seconds</b>
              </Segment>
              <Segment as="p" basic>
                Subjects will mentally note which stimulus they are perceiving
              </Segment>
              <Segment basic>{this.renderPreviewButton()}</Segment>
            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
            >
              <Header as="h1">{this.props.type}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment as="p" basic>
                Faces contain a lot of information that is relevant to our
                survival. It
                {"'"}s important to be able to quickly recognize people you can
                trust and read emotions in both strangers and people you know
              </Segment>
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title={this.props.type}
          steps={DESIGN_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          button={
            <Button primary onClick={this.handleStartExperiment}>
              Collect Data
            </Button>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
