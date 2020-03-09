// @flow
import React, { Component } from 'react';
import { Grid, Button, Segment, Header, Form, Checkbox, Image, Table } from 'semantic-ui-react';
import { isNil } from 'lodash';
import styles from '../styles/common.css';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import {
  MainTimeline,
  Trial,
  ExperimentParameters,
  ExperimentDescription,
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
import StimuliRow from './StimuliRow';

const CUSTOM_STEPS = {
  OVERVIEW: 'OVERVIEW',
  CONDITIONS: 'CONDITIONS',
  TRIALS: 'TRIALS',
  PARAMETERS: 'PARAMETERS',
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
  saved: boolean;
}

export default class CustomDesign extends Component<Props, State> {
  props: Props;
  state: State;
  handleStepClick: (string) => void;
  handleStartExperiment: (Object) => void;
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
      saved: false,
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
    this.handleSaveParams();
    this.setState({ activeStep: step });
  }

  handleProgressBar(event: Object, data: Object) {
    this.setState({
      params: { ...this.state.params, showProgessBar: data.checked },
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
    this.props.experimentActions.saveWorkspace();
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
      case CUSTOM_STEPS.CONDITIONS:
        return (
          <Grid>
            <Segment basic>
              <Header as='h1'>Conditions</Header>
              <p>
                Select the folder with images for each condition and choose the correct response.
              </p>
            </Segment>

            <Table basic='very'>
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
                      this.state.params.stimuli.filter((trial) => trial.type === number).length
                    }
                    onChange={async (key, data, changedName) => {
                      await this.setState({
                        params: {
                          ...this.state.params,
                          [changedName]: { ...this.state.params[changedName], [key]: data },
                        },
                      });
                      let newStimuli = [];
                      await stimi.map((stimul) => {
                        let dirStimuli = [];
                        const dir = this.state.params[stimul.name].dir;
                        if (dir && typeof dir !== 'undefined' && dir !== '') {
                          dirStimuli = readImages(dir).map((i) => ({
                            dir: dir,
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
                          nbTrials: newStimuli.filter((t) => t.phase === 'main').length,
                          nbPracticeTrials: newStimuli.filter((t) => t.phase === 'practice').length,
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
                <Header as='h1'>Trials</Header>
                <p>Edit the name, condition and correct key response of each trial.</p>
              </div>

              <div>
                <Form style={{ alignSelf: 'flex-end' }}>
                  <Form.Group
                    style={{
                      display: 'grid',
                      'grid-template-columns': '1fr 1fr 1fr',
                      'grid-column-gap': '10px',
                    }}
                  >
                    <Form.Select
                      fluid
                      selection
                      label='Order'
                      value={this.state.params.randomize}
                      onChange={(event, data) =>
                        this.setState({
                          params: {
                            ...this.state.params,
                            randomize: data.value,
                          },
                          saved: false,
                        })
                      }
                      placeholder='Response'
                      options={[
                        { key: 'random', text: 'Random', value: 'random' },
                        { key: 'sequential', text: 'Sequential', value: 'sequential' },
                      ]}
                    />
                    <Form.Input
                      label='Total experimental trials'
                      type='number'
                      fluid
                      value={this.state.params.nbTrials}
                      onChange={(event, data) =>
                        this.setState({
                          params: {
                            ...this.state.params,
                            nbTrials: parseInt(data.value),
                          },
                          saved: false,
                        })
                      }
                    />
                    <Form.Input
                      label='Total practice trials'
                      type='number'
                      fluid
                      value={this.state.params.nbPracticeTrials}
                      onChange={(event, data) =>
                        this.setState({
                          params: {
                            ...this.state.params,
                            nbPracticeTrials: parseInt(data.value),
                          },
                          saved: false,
                        })
                      }
                    />
                  </Form.Group>
                </Form>
              </div>
            </div>

            <Table basic='very'>
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
                      key={num}
                      num={num}
                      conditions={[1, 2, 3, 4].map((n) => this.state.params[`stimulus${n}`].title)}
                      {...e}
                      onDelete={(num) => {
                        const stimuli = this.state.params.stimuli;
                        stimuli.splice(num, 1);
                        const nbPracticeTrials = stimuli.filter((s) => s.phase === 'practice')
                          .length;
                        const nbTrials = stimuli.filter((s) => s.phase === 'main').length;
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
                      onChange={(num, key, data) => {
                        const stimuli = this.state.params.stimuli;
                        stimuli[num][key] = data;
                        let nbPracticeTrials = this.state.params.nbPracticeTrials;
                        let nbTrials = this.state.params.nbTrials;
                        if (key === 'phase') {
                          nbPracticeTrials = stimuli.filter((s) => s.phase === 'practice').length;
                          nbTrials = stimuli.filter((s) => s.phase === 'main').length;
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
              basic
              style={{ display: 'grid', 'align-content': 'space-between' }}
            >
              <Segment basic>
                <Header as='h1'>Inter-trial interval</Header>
                <p>
                  Select the inter-trial interval duration. This is the amount of time between
                  trials measured from the end of one trial to the start of the next one.
                </p>
              </Segment>
              <Segment basic style={{ 'margin-top': '100px' }}>
                <ParamSlider
                  label='ITI Duration (seconds)'
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
                  ms_conversion='250'
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
              basic
              style={{ display: 'grid', 'align-content': 'space-between' }}
            >
              <Segment basic>
                <Header as='h1'>Image duration</Header>
                <p>
                  Select the time of presentation or make it self-paced - present the image until
                  participants respond.
                </p>
              </Segment>
              <Segment basic>
                <Checkbox
                  defaultChecked={this.state.params.selfPaced}
                  label='Self-paced data collection'
                  onChange={(value) =>
                    this.setState({
                      params: { ...this.state.params, selfPaced: !this.state.params.selfPaced },
                      saved: false,
                    })
                  }
                />
              </Segment>

              {!this.state.params.selfPaced ? (
                <Segment basic>
                  <ParamSlider
                    label='Presentation time (seconds)'
                    value={this.state.params.presentationTime}
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
                    ms_conversion='250'
                    onChange={(value) =>
                      this.setState({
                        params: { ...this.state.params, presentationTime: value },
                        saved: false,
                      })
                    }
                  />
                </Segment>
              ) : (
                <Segment basic style={{ 'margin-bottom': '85px' }} />
              )}
            </Grid.Column>
          </Grid>
        );
      case CUSTOM_STEPS.PREVIEW:
        return (
          <Grid relaxed padded className={styles.contentGrid}>
            <Grid.Column
              stretched
              width={11}
              textAlign='right'
              verticalAlign='middle'
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
            <Grid.Column width={5} verticalAlign='middle'>
              <Segment basic>
                <Form>
                  <Form.TextArea
                    autoHeight
                    style={{ minHeight: 100 }}
                    label={FIELDS.INTRO}
                    value={this.state.params.intro}
                    placeholder='You will view a series of images...'
                    onChange={(event, data) =>
                      this.setState({
                        params: { ...this.state.params, intro: data.value },
                        saved: false,
                      })
                    }
                  />
                </Form>
              </Segment>

              <Segment basic>
                <Form>
                  <Form.TextArea
                    autoHeight
                    style={{ minHeight: 50 }}
                    label={FIELDS.HELP}
                    value={this.state.params.taskHelp}
                    placeholder='Press 1 for ...'
                    onChange={(event, data) =>
                      this.setState({
                        params: { ...this.state.params, taskHelp: data.value },
                        saved: false,
                      })
                    }
                  />
                </Form>
              </Segment>

              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={(e) => this.handlePreview(e)}
              />
            </Grid.Column>
          </Grid>
        );

      case CUSTOM_STEPS.OVERVIEW:
      default:
        return (
          <Grid stretched relaxed padded columns='equal' className={styles.contentGrid}>
            <Grid.Column stretched verticalAlign='middle'>
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
                  placeholder='Explain your research question here.'
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
            <Grid.Column stretched verticalAlign='middle'>
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
                  placeholder='Describe your hypothesis here.'
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
            <Grid.Column verticalAlign='middle'>
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
                  placeholder='Explain how you will design your experiment to answer the question here.'
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
    }
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title='Experiment Design'
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
              size='small'
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

// saveButton={
//   <Button
//     compact
//     size="small"
//     secondary
//     onClick={() => {
//       this.handleSaveParams();
//       // this.props.experimentActions.saveWorkspace()
//     }}
//   >
//     {this.state.saved ? 'Saved' : 'Save'}
//   </Button>
// }

//
// button={
//   <Button
//     compact
//     size="small"
//     primary
//     onClick={() => {
//       this.handleSaveParams();
//       this.handleStartExperiment();
//     }}
//   >
//     Start
//   </Button>
// }
//
// <Button
//   compact
//   size="small"
//   secondary
//   onClick={() => {
//     this.handleSaveParams();
//   }}
// >
//   {this.state.saved ? 'Saved' : 'Save'}
// </Button>
// enableEEGToggle={
//   <Checkbox
//     defaultChecked={this.props.isEEGEnabled}
//     label="Enable EEG"
//     onChange={(event, data) => this.handleEEGEnabled(event, data)}
//   />
// }
//
// <Segment basic style={{ overflow: 'auto', maxHeight: 400 }}>
//   <Form>
//     {this.state.params.stimuli && this.state.params.stimuli.map((e,num) => (
//       <StimuliRow
//         key={num}
//         num={num}
//         conditions={[1,2,3,4].map(n => this.state.params[`stimulus${n}`].title)}
//         {...e}
//         onDelete={(num) => {
//             const stimuli = this.state.params.stimuli;
//             stimuli.splice(num, 1);
//             const nbPracticeTrials = stimuli.filter(s => (s.phase === 'practice')).length;
//             const nbTrials = stimuli.filter(s => (s.phase === 'main')).length;
//             this.setState({
//               params: {
//                 ...this.state.params,
//                 stimuli: [ ... stimuli ],
//                 nbPracticeTrials,
//                 nbTrials,
//               },
//               saved: false,
//             })
//           }}
//         onChange={(num, key, data) => {
//             const stimuli = this.state.params.stimuli;
//             stimuli[num][key] = data;
//             let nbPracticeTrials = this.state.params.nbPracticeTrials;
//             let nbTrials = this.state.params.nbTrials;
//             if(key === 'phase'){
//               nbPracticeTrials = stimuli.filter(s => (s.phase === 'practice')).length;
//               nbTrials = stimuli.filter(s => (s.phase === 'main')).length;
//             }
//             this.setState({
//               params: {
//                 ...this.state.params,
//                 stimuli: [ ... stimuli ],
//                 nbPracticeTrials,
//                 nbTrials,
//               },
//               saved: false,
//             })
//           }}
//       />
//         ))}
//   </Form>
// </Segment>
