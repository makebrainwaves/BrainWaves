// @flow
import React, { Component } from "react";
import { Grid, Button, Segment, Header, Form } from "semantic-ui-react";
import { isNil, debounce } from "lodash";
import styles from "../styles/common.css";
import { EXPERIMENTS, SCREENS, EVENTS } from "../../constants/constants";
import {
  MainTimeline,
  Trial,
  ExperimentParameters,
  ExperimentDescription
} from "../../constants/interfaces";
import SecondaryNavComponent from "../SecondaryNavComponent";
import PreviewExperimentComponent from "../PreviewExperimentComponent";
import StimuliDesignColumn from "./StimuliDesignColumn";
import ParamSlider from "./ParamSlider";

const CUSTOM_STEPS = {
  OVERVIEW: "OVERVIEW",
  STIMULI: "STIMULI",
  PARAMETERS: "PARAMETERS",
  PREVIEW: "PREVIEW"
};

const FIELDS = {
  QUESTION: "Research Question",
  HYPOTHESIS: "Hypothesis",
  METHODS: "Methods",
  INTRO: "Experiment Instructions"
};

interface Props {
  history: Object;
  type: ?EXPERIMENTS;
  title: string;
  params: ?ExperimentParameters;
  mainTimeline: ?MainTimeline;
  trials: ?{ [string]: Trial };
  timelines: ?{};
  experimentActions: Object;
  description?: ExperimentDescription;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  question: string;
  hypothesis: string;
  methods: string;
}

export default class CustomDesign extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: (Object, Object) => void;
  handleStartExperiment: Object => void;
  handlePreview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: CUSTOM_STEPS.OVERVIEW,
      isPreviewing: false,
      question: isNil(props.description) ? "" : props.description.question,
      hypothesis: isNil(props.description) ? "" : props.description.hypothesis,
      methods: isNil(props.description) ? "" : props.description.methods,
      trialDuration: props.params.trialDuration,
      iti: props.params.iti,
      intro: props.params.intro,
      stim1Name: "",
      stim1Response: 1,
      stim1Dir: "",
      stim2Name: "",
      stim2Response: 9,
      stim2Dir: ""
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSaveParams = this.handleSaveParams.bind(this);
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
    if (isNil(this.props.mainTimeline)) {
      this.props.experimentActions.loadDefaultTimeline();
    }
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  handleSaveParams() {
    this.props.experimentActions.setParams({
      iti: this.state.iti,
      trialDuration: this.state.trialDuration,
      intro: this.state.intro,
      stimulus1: {
        dir: this.state.stim1Dir,
        title: this.state.stim1Name,
        type: EVENTS.FACE
      },
      stimulus2: {
        dir: this.state.stim2Dir,
        title: this.state.stim2Name,
        type: EVENTS.FACE
      }
    });
    this.props.experimentActions.setDescription({
      question: this.state.question,
      hypothesis: this.state.hypothesis,
      methods: this.state.methods
    });
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
              name={this.state.stim1Name}
              response={this.state.stim1Response}
              dir={this.state.stim1Dir}
              onChange={(key, data) => this.setState({ [key]: data })}
            />
            <StimuliDesignColumn
              num={2}
              name={this.state.stim2Name}
              response={this.state.stim2Response}
              dir={this.state.stim2Dir}
              onChange={(key, data) => this.setState({ [key]: data })}
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
                  value={this.state.trialDuration}
                  onChange={value => this.setState({ trialDuration: value })}
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
                  value={this.state.iti}
                  onChange={value => this.setState({ iti: value })}
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
                params={this.props.params}
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
                    value={this.state.intro}
                    placeholder="You will view a series of images..."
                    onChange={(event, data) =>
                      this.setState({ intro: data.value })
                    }
                  />
                </Form>
              </Segment>
              <Segment basic>{this.renderPreviewButton()}</Segment>
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
                  value={this.state.question}
                  placeholder="Explain your research question here."
                  onChange={(event, data) =>
                    this.setState({ question: data.value })
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
                  value={this.state.hypothesis}
                  placeholder="Describe your hypothesis here."
                  onChange={(event, data) =>
                    this.setState({ hypothesis: data.value })
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
                  value={this.state.methods}
                  placeholder="Explain how you will design your experiment to answer the question here."
                  onChange={(event, data) =>
                    this.setState({ methods: data.value })
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
              <Button compact size="small" secondary onClick={this.handleSaveParams}>
                Save Experiment
              </Button>
              <Button compact size="small" primary onClick={this.handleStartExperiment}>
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
