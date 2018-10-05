// @flow
import React, { Component } from 'react';
import {
  Grid,
  Button,
  Segment,
  Header,
  Form,
  Checkbox
} from 'semantic-ui-react';
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
import StimuliDesignColumn from './StimuliDesignColumn';
import ParamSlider from './ParamSlider';
import PreviewButton from '../PreviewButtonComponent';

const CUSTOM_STEPS = {
  OVERVIEW: 'OVERVIEW',
  STIMULI: 'STIMULI',
  PARAMETERS: 'PARAMETERS',
  PREVIEW: 'PREVIEW'
};

const FIELDS = {
  QUESTION: 'Research Question',
  HYPOTHESIS: 'Hypothesis',
  METHODS: 'Methods',
  INTRO: 'Experiment Instructions'
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
  description: ExperimentDescription;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  description: ExperimentDescription;
  params: ExperimentParameters;
}

export default class CustomDesign extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: string => void;
  handleStartExperiment: Object => void;
  handlePreview: () => void;
  handleSaveParams: () => void;
  handleProgressBar: (Object, Object) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: CUSTOM_STEPS.OVERVIEW,
      isPreviewing: false,
      description: props.description,
      params: props.params
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSaveParams = this.handleSaveParams.bind(this);
    this.handleProgressBar = this.handleProgressBar.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
    }
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleProgressBar(event: Object, data: Object) {
    this.setState({
      params: { ...this.state.params, showProgessBar: data.checked }
    });
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handlePreview() {
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  handleSaveParams() {
    this.props.experimentActions.setParams(this.state.params);
    this.props.experimentActions.setDescription(this.state.description);
  }

  renderSectionContent() {
    switch (this.state.activeStep) {
      case CUSTOM_STEPS.STIMULI:
        return (
          <Grid
            stretched
            padded
            relaxed="very"
            columns="equal"
            className={styles.contentGrid}
          >
            <StimuliDesignColumn
              num={1}
              {...this.state.params.stimulus1}
              onChange={(key, data) =>
                this.setState({
                  params: {
                    ...this.state.params,
                    stimulus1: { ...this.state.params.stimulus1, [key]: data }
                  }
                })
              }
            />
            <StimuliDesignColumn
              num={2}
              {...this.state.params.stimulus2}
              onChange={(key, data) =>
                this.setState({
                  params: {
                    ...this.state.params,
                    stimulus2: { ...this.state.params.stimulus2, [key]: data }
                  }
                })
              }
            />
          </Grid>
        );
      case CUSTOM_STEPS.PARAMETERS:
        return (
          <Grid
            stretched
            padded
            relaxed="very"
            columns="equal"
            className={styles.contentGrid}
          >
            <Grid.Column stretched verticalAlign="middle">
              <Segment basic>
                <Header as="h1">Trial Duration</Header>
                <p>
                  Select the trial duration. This determines the amount of time
                  each image will be displayed during the experiment.
                </p>
              </Segment>
              <Segment basic>
                <ParamSlider
                  label="Trial Duration (seconds)"
                  value={this.state.params.trialDuration}
                  onChange={value =>
                    this.setState({
                      params: { ...this.state.params, trialDuration: value }
                    })
                  }
                />
              </Segment>
            </Grid.Column>
            <Grid.Column stretched verticalAlign="middle">
              <Segment basic>
                <Header as="h1">ITI Duration</Header>
                <p>
                  Select the intertrial interval duration. This is the amount of
                  time between trials measured from the end of one trial to the
                  start of the next one.
                </p>
              </Segment>
              <Segment basic>
                <ParamSlider
                  label="ITI Duration (seconds)"
                  value={this.state.params.iti}
                  onChange={value =>
                    this.setState({
                      params: { ...this.state.params, iti: value }
                    })
                  }
                />
              </Segment>
            </Grid.Column>
            <Grid.Column stretched verticalAlign="middle">
              <Segment basic>
                <Header as="h1">Progress Bar</Header>
                <p>
                  This will display a small progress bar at the top of the
                  experiment window
                </p>
              </Segment>
              <Segment basic>
                <Checkbox
                  checked={this.state.params.showProgessBar}
                  label="Enable progress bar"
                  onChange={this.handleProgressBar}
                />
              </Segment>
            </Grid.Column>
          </Grid>
        );
      case CUSTOM_STEPS.PREVIEW:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={6}
              textAlign="right"
              verticalAlign="top"
              className={styles.jsPsychColumn}
            >
              <PreviewExperimentComponent
                params={this.state.params}
                mainTimeline={this.props.mainTimeline}
                trials={this.props.trials}
                timelines={this.props.timelines}
                isPreviewing={this.state.isPreviewing}
              />
            </Grid.Column>
            <Grid.Column width={6} verticalAlign="middle">
              <Segment basic>
                <Form>
                  <Form.TextArea
                    autoHeight
                    style={{ minHeight: 100 }}
                    label={FIELDS.INTRO}
                    value={this.state.params.intro}
                    placeholder="You will view a series of images..."
                    onChange={(event, data) =>
                      this.setState({
                        params: { ...this.state.params, intro: data.value }
                      })
                    }
                  />
                </Form>
              </Segment>
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={this.handlePreview}
              />
            </Grid.Column>
          </Grid>
        );

      case CUSTOM_STEPS.OVERVIEW:
      default:
        return (
          <Grid
            stretched
            relaxed
            padded
            columns="equal"
            className={styles.contentGrid}
          >
            <Grid.Column stretched verticalAlign="middle">
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100 }}
                  label={FIELDS.QUESTION}
                  value={this.state.description.question}
                  placeholder="Explain your research question here."
                  onChange={(event, data) =>
                    this.setState({
                      description: {
                        ...this.state.description,
                        question: data.value
                      }
                    })
                  }
                />
              </Form>
            </Grid.Column>
            <Grid.Column stretched verticalAlign="middle">
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100 }}
                  label={FIELDS.HYPOTHESIS}
                  value={this.state.description.hypothesis}
                  placeholder="Describe your hypothesis here."
                  onChange={(event, data) =>
                    this.setState({
                      description: {
                        ...this.state.description,
                        hypothesis: data.value
                      }
                    })
                  }
                />
              </Form>
            </Grid.Column>
            <Grid.Column stretched verticalAlign="middle">
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100 }}
                  label={FIELDS.METHODS}
                  value={this.state.description.methods}
                  placeholder="Explain how you will design your experiment to answer the question here."
                  onChange={(event, data) =>
                    this.setState({
                      description: {
                        ...this.state.description,
                        methods: data.value
                      }
                    })
                  }
                />
              </Form>
            </Grid.Column>
          </Grid>
        );
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Experiment Design"
          steps={CUSTOM_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          button={
            <div>
              <Button
                compact
                size="small"
                secondary
                onClick={this.handleSaveParams}
              >
                Save Experiment
              </Button>
              <Button
                compact
                size="small"
                primary
                onClick={this.handleStartExperiment}
              >
                Collect Data
              </Button>
            </div>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
