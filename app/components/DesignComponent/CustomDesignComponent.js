// @flow
import React, { Component } from 'react';
import {
  Grid,
  Button,
  Segment,
  Header,
  Form,
  Checkbox,
  Image,
  Icon
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
import researchQuestionImage from '../../assets/common/ResearchQuestion2.png';
import methodsImage from '../../assets/common/Methods2.png';
import hypothesisImage from '../../assets/common/Hypothesis2.png';
import { loadProtocol } from '../../utils/labjs/functions';
import { readImages } from '../../utils/filesystem/storage';

const CUSTOM_STEPS = {
  OVERVIEW: 'OVERVIEW',
  PARAMETERS: 'PARAMETERS',
  PREVIEW: 'PREVIEW'
};

// const CUSTOM_STEPS = {
//   OVERVIEW: 'OVERVIEW',
//   STIMULI: 'STIMULI',
//   PARAMETERS: 'PARAMETERS',
//   PREVIEW: 'PREVIEW'
// };

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
  isEEGEnabled: boolean;
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
      params: props.params,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSaveParams = this.handleSaveParams.bind(this);
    this.handleProgressBar = this.handleProgressBar.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
    }
    this.endPreview = this.endPreview.bind(this);
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleProgressBar(event: Object, data: Object) {
    this.setState({
      params: { ...this.state.params, showProgessBar: data.checked }
    });
  }

  handleEEGEnabled(event: Object, data: Object) {
    this.props.experimentActions.setEEGEnabled(data.checked);
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handlePreview(e) {
    e.target.blur();
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
                  <Header as="h1">Time Interval</Header>
                  <p>
                    Select the inter-trial interval duration. This is the amount
                    of time between trials measured from the end of one trial to
                    the start of the next one.
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
            </Grid>
          );
      case CUSTOM_STEPS.PREVIEW:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={11}
              textAlign="right"
              verticalAlign="middle"
              className={styles.previewWindow}
            >
              <PreviewExperimentComponent
                {...loadProtocol(this.props.paradigm)}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
                paradigm={this.props.paradigm}
                previewParams={this.props.params}
              />
            </Grid.Column>
            <Grid.Column width={5} verticalAlign="middle">
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
                onClick={e => this.handlePreview(e)}
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
              <Image
                as={Segment}
                basic
                centered
                src={researchQuestionImage}
                className={styles.overviewImage}
              />
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100, maxHeight: 400 }}
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
              <Image
                as={Segment}
                basic
                centered
                src={hypothesisImage}
                className={styles.overviewImage}
              />
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100, maxHeight: 400 }}
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
            <Grid.Column verticalAlign="middle">
              <Image
                as={Segment}
                basic
                centered
                src={methodsImage}
                className={styles.overviewImage}
              />
              <Form>
                <Form.TextArea
                  autoHeight
                  style={{ minHeight: 100, maxHeight: 400 }}
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
          enableEEGToggle={
            <Checkbox
              defaultChecked={this.props.isEEGEnabled}
              label="Enable EEG"
              onChange={(event, data) => this.handleEEGEnabled(event, data)}
            />
          }
          button={
            <Button
              compact
              size="small"
              primary
              onClick={() => {
                this.handleSaveParams();
                this.handleStartExperiment();
              }}
            >
              Collect Data
            </Button>
          }
          saveButton={
            <Button
              compact
              size="small"
              secondary
              onClick={() => {
                this.handleSaveParams();
                this.props.experimentActions.saveWorkspace()
              }}
            >
              <Icon name="save" />
              Save
            </Button>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
