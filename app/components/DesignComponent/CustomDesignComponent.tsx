import React, { Component } from 'react';
import {
  Grid,
  Button,
  Segment,
  Header,
  Form,
  Checkbox,
  Image,
  Table,
} from 'semantic-ui-react';
import { isNil } from 'lodash';
import { HashHistory } from 'history';

import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import {
  Trial,
  ExperimentParameters,
  ExperimentDescription,
  StimuliDesc,
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import StimuliDesignColumn from './StimuliDesignColumn';
import { ParamSlider } from './ParamSlider';
import PreviewButton from '../PreviewButtonComponent';
import researchQuestionImage from '../../assets/common/ResearchQuestion2.png';
import methodsImage from '../../assets/common/Methods2.png';
import hypothesisImage from '../../assets/common/Hypothesis2.png';
import { loadProtocol } from '../../utils/labjs/functions';
import { readImages } from '../../utils/filesystem/storage';
import { StimuliRow } from './StimuliRow';
import { ExperimentActions } from '../../actions/experimentActions';

const CUSTOM_STEPS = {
  OVERVIEW: 'OVERVIEW',
  CONDITIONS: 'CONDITIONS',
  TRIALS: 'TRIALS',
  PARAMETERS: 'PARAMETERS',
  INSTRUCTIONS: 'INSTRUCTIONS',
  PREVIEW: 'PREVIEW',
};

const FIELDS = {
  QUESTION: 'Research Question',
  HYPOTHESIS: 'Hypothesis',
  METHODS: 'Methods',
  INTRO: 'Experiment Instructions',
  HELP: 'Instructions for the task screen',
};

interface Props {
  history: HashHistory;
  type: EXPERIMENTS | null | undefined;
  title: string;
  params: ExperimentParameters;
  trials: {
    [key: string]: Trial;
  };
  timelines: {};
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
  description: ExperimentDescription;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  description: ExperimentDescription;
  params: ExperimentParameters;
  saved: boolean;
}

export default class CustomDesign extends Component<Props, State> {
  // handleStartExperiment: (Object) => void;

  // handlePreview: () => void;
  // handleSaveParams: () => void;
  // handleProgressBar: (Object, Object) => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      activeStep: CUSTOM_STEPS.OVERVIEW,
      isPreviewing: true,
      description: props.description,
      params: props.params,
      saved: false,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSaveParams = this.handleSaveParams.bind(this);
    this.handleProgressBar = this.handleProgressBar.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
    if (isNil(props.params)) {
      props.ExperimentActions.LoadDefaultTimeline();
    }
    this.endPreview = this.endPreview.bind(this);
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleStepClick(step: string) {
    this.handleSaveParams();
    this.setState({ activeStep: step });
  }

  handleProgressBar(event: object, data: object) {
    this.setState({
      params: { ...this.state.params, showProgessBar: data.checked },
    });
  }

  handleEEGEnabled(event: object, data: object) {
    this.props.ExperimentActions.SetEEGEnabled(data.checked);
  }

  handleStartExperiment() {
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handlePreview(e) {
    e.target.blur();
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  handleSaveParams() {
    this.props.ExperimentActions.SetParams(this.state.params);
    this.props.ExperimentActions.SetDescription(this.state.description);
    this.props.ExperimentActions.SaveWorkspace();
    this.setState({ saved: true });
  }

  renderSectionContent() {
    const stimi = [
      { name: 'stimulus1', number: 1 },
      { name: 'stimulus2', number: 2 },
      { name: 'stimulus3', number: 3 },
      { name: 'stimulus4', number: 4 },
    ];
    switch (this.state.activeStep) {
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
                        question: data.value,
                      },
                      saved: false,
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
                        hypothesis: data.value,
                      },
                      saved: false,
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
                        methods: data.value,
                      },
                      saved: false,
                    })
                  }
                />
              </Form>
            </Grid.Column>
          </Grid>
        );

      case CUSTOM_STEPS.CONDITIONS:
        return (
          <Grid>
            <Segment basic>
              <Header as="h1">Conditions</Header>
              <p>
                {`Select the folder with images for each condition and choose
                the correct response. You can upload image files with the
                following extensions: ".png", ".jpg", ".jpeg". Make sure when
                you preview your experiment that the resolution is high enough.
                You can resize or compress your images in an image editing
                program or on one of the websites online.`}
              </p>
            </Segment>

            <Table basic="very">
              <Table.Header>
                <Table.Row className={styles.conditionHeaderRow}>
                  <Table.HeaderCell className={styles.conditionHeaderRowName}>
                    Condition
                  </Table.HeaderCell>
                  <Table.HeaderCell>Default Key Response</Table.HeaderCell>
                  <Table.HeaderCell>Condition Folder</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body className={styles.experimentTable}>
                {stimi.map(({ name, number }) => (
                  <StimuliDesignColumn
                    key={number}
                    num={number}
                    {...this.state.params[name]}
                    numberImages={
                      this.state.params.stimuli.filter(
                        (trial) => trial.type === number
                      ).length
                    }
                    onChange={async (key, data, changedName) => {
                      await this.setState({
                        params: {
                          ...this.state.params,
                          [changedName]: {
                            ...this.state.params[changedName],
                            [key]: data,
                          },
                        },
                      });
                      let newStimuli: StimuliDesc[] = [];
                      await stimi.forEach((stimul) => {
                        let dirStimuli: StimuliDesc[] = [];
                        const { dir } = this.state.params[stimul.name];
                        if (dir && typeof dir !== 'undefined' && dir !== '') {
                          dirStimuli = readImages(dir).map((i) => ({
                            dir,
                            filename: i,
                            name: i,
                            condition: this.state.params[stimul.name].title,
                            response: this.state.params[stimul.name].response,
                            phase: 'main',
                            type: stimul.number,
                          }));
                        }
                        if (dirStimuli.length) dirStimuli[0].phase = 'practice';
                        newStimuli = newStimuli.concat(...dirStimuli);
                      });
                      this.setState({
                        params: {
                          ...this.state.params,
                          stimuli: [...newStimuli],
                          nbTrials: newStimuli.filter((t) => t.phase === 'main')
                            .length,
                          nbPracticeTrials: newStimuli.filter(
                            (t) => t.phase === 'practice'
                          ).length,
                        },
                        saved: false,
                      });
                    }}
                  />
                ))}
              </Table.Body>
            </Table>
          </Grid>
        );

      case CUSTOM_STEPS.TRIALS:
        return (
          <Grid>
            <div className={styles.trialsHeader}>
              <div>
                <Header as="h1">Trials</Header>
                <p>Edit the correct key response and type of each trial.</p>
              </div>

              <div>
                <Form style={{ alignSelf: 'flex-end' }}>
                  <Form.Group className={styles.trialsTopInfoBar}>
                    <Form.Select
                      fluid
                      selection
                      label="Order"
                      value={this.state.params.randomize}
                      onChange={(event, data) => {
                        if (
                          data.value === 'sequential' ||
                          data.value === 'random'
                        ) {
                          this.setState({
                            params: {
                              ...this.state.params,
                              randomize: data.value,
                            },
                            saved: false,
                          });
                        }
                      }}
                      placeholder="Response"
                      options={[
                        { key: 'random', text: 'Random', value: 'random' },
                        {
                          key: 'sequential',
                          text: 'Sequential',
                          value: 'sequential',
                        },
                      ]}
                    />
                    <Form.Input
                      label="Total experimental trials"
                      type="number"
                      fluid
                      value={this.state.params.nbTrials}
                      onChange={(event, data) =>
                        this.setState({
                          params: {
                            ...this.state.params,
                            nbTrials: parseInt(data.value, 10),
                          },
                          saved: false,
                        })
                      }
                    />
                    <Form.Input
                      label="Total practice trials"
                      type="number"
                      fluid
                      value={this.state.params.nbPracticeTrials}
                      onChange={(event, data) =>
                        this.setState({
                          params: {
                            ...this.state.params,
                            nbPracticeTrials: parseInt(data.value, 10),
                          },
                          saved: false,
                        })
                      }
                    />
                  </Form.Group>
                </Form>
              </div>
            </div>

            <Table basic="very">
              <Table.Header>
                <Table.Row className={styles.trialsHeaderRow}>
                  <Table.HeaderCell className={styles.conditionHeaderRowName}>
                    Name
                  </Table.HeaderCell>
                  <Table.HeaderCell>Condition</Table.HeaderCell>
                  <Table.HeaderCell>Correct Key Response</Table.HeaderCell>
                  <Table.HeaderCell>Trial Type</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body className={styles.trialsTable}>
                {this.state.params.stimuli &&
                  this.state.params.stimuli.map((e, num) => (
                    <StimuliRow
                      key={`stim_row_${num}`}
                      num={num}
                      conditions={[1, 2, 3, 4].map(
                        (n) => this.state.params[`stimulus${n}`].title
                      )}
                      {...e}
                      onDelete={(deletedNum) => {
                        const { stimuli } = this.state.params;
                        stimuli.splice(deletedNum, 1);
                        const nbPracticeTrials = stimuli.filter(
                          (s) => s.phase === 'practice'
                        ).length;
                        const nbTrials = stimuli.filter(
                          (s) => s.phase === 'main'
                        ).length;
                        this.setState({
                          params: {
                            ...this.state.params,
                            stimuli: [...stimuli],
                            nbPracticeTrials,
                            nbTrials,
                          },
                          saved: false,
                        });
                      }}
                      onChange={(changedNum, key, data) => {
                        const { stimuli } = this.state.params;
                        stimuli[changedNum][key] = data;
                        let { nbPracticeTrials } = this.state.params;
                        let { nbTrials } = this.state.params;
                        if (key === 'phase') {
                          nbPracticeTrials = stimuli.filter(
                            (s) => s.phase === 'practice'
                          ).length;
                          nbTrials = stimuli.filter((s) => s.phase === 'main')
                            .length;
                        }
                        this.setState({
                          params: {
                            ...this.state.params,
                            stimuli: [...stimuli],
                            nbPracticeTrials,
                            nbTrials,
                          },
                          saved: false,
                        });
                      }}
                    />
                  ))}
              </Table.Body>
            </Table>
          </Grid>
        );

      case CUSTOM_STEPS.PARAMETERS:
        return (
          <Grid>
            <Grid.Column
              width={8}
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <Segment basic>
                <Header as="h1">Inter-trial interval</Header>
                <p>
                  Select the inter-trial interval duration. This is the amount
                  of time between trials measured from the end of one trial to
                  the start of the next one.
                </p>
              </Segment>
              <Segment basic style={{ marginTop: '100px' }}>
                <ParamSlider
                  label="ITI Duration (seconds)"
                  value={this.state.params.iti}
                  marks={{
                    1: '0.25',
                    2: '0.5',
                    3: '0.75',
                    4: '1',
                    5: '1.25',
                    6: '1.5',
                    7: '1.75',
                    8: '2',
                  }}
                  msConversion="250"
                  onChange={(value) =>
                    this.setState({
                      params: { ...this.state.params, iti: value },
                      saved: false,
                    })
                  }
                />
              </Segment>
            </Grid.Column>

            <Grid.Column
              width={8}
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <Segment basic>
                <Header as="h1">Image duration</Header>
                <p>
                  Select the time of presentation or make it self-paced -
                  present the image until participants respond.
                </p>
              </Segment>
              <Segment basic>
                <Checkbox
                  defaultChecked={this.state.params.selfPaced}
                  label="Self-paced data collection"
                  onChange={(value) =>
                    this.setState({
                      params: {
                        ...this.state.params,
                        selfPaced: !this.state.params.selfPaced,
                      },
                      saved: false,
                    })
                  }
                />
              </Segment>

              {!this.state.params.selfPaced ? (
                <Segment basic>
                  <ParamSlider
                    label="Presentation time (seconds)"
                    value={
                      this.state.params.presentationTime
                        ? this.state.params.presentationTime
                        : 0
                    }
                    marks={{
                      1: '0.25',
                      2: '0.5',
                      3: '0.75',
                      4: '1',
                      5: '1.25',
                      6: '1.5',
                      7: '1.75',
                      8: '2',
                    }}
                    msConversion="250"
                    onChange={(value) =>
                      this.setState({
                        params: {
                          ...this.state.params,
                          presentationTime: value,
                        },
                        saved: false,
                      })
                    }
                  />
                </Segment>
              ) : (
                <Segment basic style={{ marginBottom: '85px' }} />
              )}
            </Grid.Column>
          </Grid>
        );

      case CUSTOM_STEPS.INSTRUCTIONS:
        return (
          <Grid stretched>
            <Grid.Column
              width={8}
              stretched
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <Segment basic>
                <Header as="h1">Experiment Instructions</Header>
                <p>
                  Edit the instruction that will be displayed on the first
                  screen.
                </p>
                <Form>
                  <Form.TextArea
                    autoHeight
                    value={this.state.params.intro}
                    placeholder="e.g., You will view a series of faces and houses. Press 1 when a face appears and 9 for a house. Press the the space bar on your keyboard to start doing the practice trials. If you want to skip the practice trials and go directly to the task, press the 'q' button on your keyboard."
                    onChange={(event, data) =>
                      this.setState({
                        params: { ...this.state.params, intro: data.value },
                        saved: false,
                      })
                    }
                  />
                </Form>
              </Segment>
            </Grid.Column>

            <Grid.Column
              width={8}
              stretched
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <Segment basic>
                <Header as="h1">Instructions for the task screen</Header>
                <p>
                  Edit the instruction that will be displayed in the footer
                  during the task.
                </p>
                <Form>
                  <Form.TextArea
                    autoHeight
                    value={this.state.params.taskHelp}
                    placeholder="e.g., Press 1 for a face and 9 for a house"
                    onChange={(event, data) =>
                      this.setState({
                        params: { ...this.state.params, taskHelp: data.value },
                        saved: false,
                      })
                    }
                  />
                </Form>
              </Segment>
            </Grid.Column>
          </Grid>
        );

      case CUSTOM_STEPS.PREVIEW:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={14}
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
                title={this.props.title}
              />
            </Grid.Column>

            <Grid.Column width={2} verticalAlign="top">
              <Segment basic>
                <PreviewButton
                  isPreviewing={this.state.isPreviewing}
                  onClick={(e) => this.handlePreview(e)}
                />
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
          title="Experiment Design"
          steps={CUSTOM_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          enableEEGToggle={
            <Checkbox
              toggle
              defaultChecked={this.props.isEEGEnabled}
              onChange={(event, data) => this.handleEEGEnabled(event, data)}
              className={styles.EEGToggle}
            />
          }
          saveButton={
            <Button
              compact
              size="small"
              secondary
              onClick={() => {
                this.handleSaveParams();
              }}
            >
              {this.state.saved ? 'Save' : 'Save'}
            </Button>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
