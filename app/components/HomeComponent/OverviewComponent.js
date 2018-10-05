import React, { Component } from 'react';
import { Grid, Header, Button, Segment } from 'semantic-ui-react';
import styles from '../styles/common.css';
import { EXPERIMENTS } from '../../constants/constants';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { loadTimeline } from '../../utils/jspsych/functions';

const OVERVIEW_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL'
};

interface Props {
  type: EXPERIMENTS;
  onStartExperiment: EXPERIMENTS => void;
  onCloseOverview: () => void;
}

interface State {
  activeStep: OVERVIEW_STEPS;
  isPreviewing: boolean;
}

export default class OverviewComponent extends Component<Props, State> {
  props: Props;
  state: State;
  constructor(props) {
    super(props);
    this.state = {
      activeStep: OVERVIEW_STEPS.OVERVIEW,
      isPreviewing: false
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handlePreview() {
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case OVERVIEW_STEPS.PROTOCOL:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="middle"
              className={styles.jsPsychColumn}
            >
              <PreviewExperimentComponent
                {...loadTimeline(this.props.type)}
                isPreviewing={this.state.isPreviewing}
              />
            </Grid.Column>
            <Grid.Column width={6} verticalAlign="middle">
              <p>
                Subjects will view a series of images of{' '}
                <b> faces and houses</b> for <b>120 seconds</b>
              </p>
              <p>
                Subjects will mentally note which stimulus they are perceiving
              </p>
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={this.handlePreview}
              />
            </Grid.Column>
          </Grid>
        );
      case OVERVIEW_STEPS.BACKGROUND:
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
      case OVERVIEW_STEPS.OVERVIEW:
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
      <React.Fragment>
        <Button
          basic
          circular
          size="huge"
          floated="right"
          icon="x"
          className={styles.closeButton}
          onClick={this.props.onCloseOverview}
        />
        <SecondaryNavComponent
          title={this.props.type}
          steps={OVERVIEW_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          button={
            <Button
              primary
              onClick={() => this.props.onStartExperiment(this.props.type)}
            >
              Start Experiment{' '}
            </Button>
          }
        />
        <div className={styles.homeContentContainer}>
          {this.renderSectionContent()}
        </div>
      </React.Fragment>
    );
  }
}
