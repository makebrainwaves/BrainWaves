// @flow
import React, { Component } from 'react';
import { Grid, Button, Segment, Header, Image } from 'semantic-ui-react';
import { isNil } from 'lodash';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import {
  MainTimeline,
  Trial,
  ExperimentParameters,
  ExperimentDescription
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import PreviewButton from '../PreviewButtonComponent';
import facesHousesOverview from '../../assets/common/FacesHouses_Overview.png';
import { loadTimeline } from '../../utils/jspsych/functions';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL'
};

interface Props {
  history: Object;
  type: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
  experimentActions: Object;
  description: ExperimentDescription;
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
    this.endPreview = this.endPreview.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
    }
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handlePreview() {
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  endPreview() {
    this.setState({ isPreviewing: false });
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
            <Header as="h1">{this.props.background_title}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment basic>
                {this.props.background}
              </Segment>

            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.PROTOCOL:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={12}
              textAlign="right"
              verticalAlign="middle"
              className={styles.jsPsychColumn}
            >
              <PreviewExperimentComponent
                {...loadTimeline(this.props.type)}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
              />
            </Grid.Column>
            <Grid.Column width={4} verticalAlign="middle">
              <Segment as="p" basic>
                {this.props.protocol}
              </Segment>
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={this.handlePreview}
              />
            </Grid.Column>
          </Grid>
        );
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <Grid stretched relaxed padded className={styles.contentGrid}>
            <Grid.Column width={3}>
              <Segment basic padded>
                <Image src={facesHousesOverview} />
              </Segment>
            </Grid.Column>
            <Grid.Column
              stretched
              width={3}
              textAlign="right"
              verticalAlign="middle"
            >
              <Header as="h1">{this.props.type}</Header>
            </Grid.Column>
            <Grid.Column stretched width={6} verticalAlign="middle">
              <Segment as="p" basic>
                {this.props.overview}
              </Segment>
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    if (this.props.type === EXPERIMENTS.CUSTOM) {
      return <CustomDesign {...this.props} />;
    }
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Experiment Design"
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
