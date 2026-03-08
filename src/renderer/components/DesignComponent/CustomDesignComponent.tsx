import React, { Component } from 'react';
import { isString } from 'lodash';

import styles from '../styles/common.module.css';
import { SCREENS } from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { DesignProps } from './index';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import { ParamSlider } from './ParamSlider';
import PreviewButton from '../PreviewButtonComponent';
import researchQuestionImage from '../../assets/common/ResearchQuestion2.png';
import methodsImage from '../../assets/common/Methods2.png';
import hypothesisImage from '../../assets/common/Hypothesis2.png';

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

interface State {
  activeStep: string;
  isPreviewing: boolean;
  params: ExperimentParameters;
  saved: boolean;
}

export default class CustomDesign extends Component<DesignProps, State> {
  constructor(props: DesignProps) {
    super(props);
    this.state = {
      activeStep: CUSTOM_STEPS.OVERVIEW,
      isPreviewing: true,
      params: props.params,
      saved: false,
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSaveParams = this.handleSaveParams.bind(this);
    this.handleProgressBar = this.handleProgressBar.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
    this.endPreview = this.endPreview.bind(this);
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleStepClick(step: string) {
    this.handleSaveParams();
    this.setState({ activeStep: step });
  }

  handleProgressBar(checked: boolean | undefined) {
    if (checked === undefined) return;
    this.setState((prevState) => ({
      params: { ...prevState.params, showProgessBar: checked },
    }));
  }

  handleEEGEnabled(checked: boolean | undefined) {
    if (checked === undefined) return;
    this.props.ExperimentActions.SetEEGEnabled(checked);
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
    this.props.ExperimentActions.SaveWorkspace();
    this.setState({ saved: true });
  }

  handleSetText(text: string, section: 'hypothesis' | 'methods' | 'question') {
    // @ts-expect-error
    this.setState((prevState) => ({
      params: {
        ...prevState.params,
        description: { ...prevState.params.description, [section]: text },
      },
      saved: false,
    }));
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
          <div className={`grid grid-cols-2 gap-4 ${styles.contentGrid}`} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="flex flex-col items-center justify-center">
              <img
                src={researchQuestionImage}
                className={`max-w-full ${styles.overviewImage}`}
              />
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{FIELDS.QUESTION}</label>
                  <textarea
                    style={{ minHeight: 100, maxHeight: 400 }}
                    value={this.state.params.description?.question}
                    placeholder="Explain your research question here."
                    onChange={(event) => {
                      const val = event.target.value;
                      if (!isString(val)) {
                        return;
                      }
                      this.handleSetText(val, 'question');
                    }}
                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>
            <div className="flex flex-col items-center justify-center">
              <img
                src={hypothesisImage}
                className={`max-w-full ${styles.overviewImage}`}
              />
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{FIELDS.HYPOTHESIS}</label>
                  <textarea
                    style={{ minHeight: 100, maxHeight: 400 }}
                    value={this.state.params.description?.hypothesis}
                    placeholder="Describe your hypothesis here."
                    onChange={(event) => {
                      const val = event.target.value;
                      if (!isString(val)) {
                        return;
                      }
                      this.handleSetText(val, 'hypothesis');
                    }}
                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>
            <div className="flex flex-col items-center justify-center">
              <img
                src={methodsImage}
                className={`max-w-full ${styles.overviewImage}`}
              />
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{FIELDS.METHODS}</label>
                  <textarea
                    style={{ minHeight: 100, maxHeight: 400 }}
                    value={this.state.params.description?.methods}
                    placeholder="Explain how you will design your experiment to answer the question here."
                    onChange={(event) => {
                      const val = event.target.value;
                      if (!isString(val)) {
                        return;
                      }
                      this.handleSetText(val, 'methods');
                    }}
                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>
          </div>
        );

      case CUSTOM_STEPS.CONDITIONS:
        return (
          <div>
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-2">Conditions</h1>
              <p>
                {`Select the folder with images for each condition and choose
                the correct response. You can upload image files with the
                following extensions: ".png", ".jpg", ".jpeg". Make sure when
                you preview your experiment that the resolution is high enough.
                You can resize or compress your images in an image editing
                program or on one of the websites online.`}
              </p>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className={styles.conditionHeaderRow}>
                  <th className={`border border-gray-200 px-4 py-2 bg-gray-50 text-left ${styles.conditionHeaderRowName}`}>
                    Condition
                  </th>
                  <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left">Default Key Response</th>
                  <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left">Condition Folder</th>
                </tr>
              </thead>

              <tbody className={styles.experimentTable}>
                <tr><td><div>Stimulus customization is currently unavailable</div></td></tr>
                {stimi.map(({ name, number }) => (
                  <tr key={name}>
                    <td>{`Stimulus name: ${name}, number: ${number}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case CUSTOM_STEPS.TRIALS:
        return (
          <div>
            <div className={styles.trialsHeader}>
              <div>
                <h1 className="text-2xl font-bold mb-2">Trials</h1>
                <p>Edit the correct key response and type of each trial.</p>
              </div>

              <div>
                <form style={{ alignSelf: 'flex-end' }}>
                  <div className={`flex gap-4 ${styles.trialsTopInfoBar}`}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Order</label>
                      <select
                        value={this.state.params.randomize}
                        onChange={(event) => {
                          const val = event.target.value;
                          if (val === 'sequential' || val === 'random') {
                            this.setState({
                              params: {
                                ...this.state.params,
                                randomize: val,
                              },
                              saved: false,
                            });
                          }
                        }}
                        className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>Response</option>
                        <option value="random">Random</option>
                        <option value="sequential">Sequential</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Total experimental trials</label>
                      <input
                        type="number"
                        value={this.state.params.nbTrials}
                        onChange={(event) =>
                          this.setState({
                            params: {
                              ...this.state.params,
                              nbTrials: parseInt(event.target.value, 10),
                            },
                            saved: false,
                          })
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Total practice trials</label>
                      <input
                        type="number"
                        value={this.state.params.nbPracticeTrials}
                        onChange={(event) =>
                          this.setState({
                            params: {
                              ...this.state.params,
                              nbPracticeTrials: parseInt(event.target.value, 10),
                            },
                            saved: false,
                          })
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className={styles.trialsHeaderRow}>
                  <th className={`border border-gray-200 px-4 py-2 bg-gray-50 text-left ${styles.conditionHeaderRowName}`}>
                    Name
                  </th>
                  <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left">Condition</th>
                  <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left">Correct Key Response</th>
                  <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left">Trial Type</th>
                </tr>
              </thead>
              <tbody className={styles.trialsTable}>
                <tr><td><div>Stimulus customization is currently unavailable</div></td></tr>

                {/* {this.state.params.stimuli &&
                  this.state.params.stimuli.map((e, num) => (
                    <StimuliRow
                      key={`stim_row_${num}`}
                      num={num}
                      condition={[1, 2, 3, 4].map(
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
                  ))} */}
              </tbody>
            </table>
          </div>
        );

      case CUSTOM_STEPS.PARAMETERS:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="w-2/3"
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">Inter-trial interval</h1>
                <p>
                  Select the inter-trial interval duration. This is the amount
                  of time between trials measured from the end of one trial to
                  the start of the next one.
                </p>
              </div>
              <div className="p-4" style={{ marginTop: '100px' }}>
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
              </div>
            </div>

            <div
              className="w-2/3"
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">Image duration</h1>
                <p>
                  Select the time of presentation or make it self-paced -
                  present the image until participants respond.
                </p>
              </div>
              <div className="p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={this.state.params.selfPaced}
                    onChange={(e) =>
                      this.setState({
                        params: {
                          ...this.state.params,
                          selfPaced: !this.state.params.selfPaced,
                        },
                        saved: false,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Self-paced data collection</span>
                </label>
              </div>

              {!this.state.params.selfPaced ? (
                <div className="p-4">
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
                </div>
              ) : (
                <div className="p-4" style={{ marginBottom: '85px' }} />
              )}
            </div>
          </div>
        );

      case CUSTOM_STEPS.INSTRUCTIONS:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="w-2/3"
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">Experiment Instructions</h1>
                <p>
                  Edit the instruction that will be displayed on the first
                  screen.
                </p>
                <form>
                  <div className="mb-4">
                    <textarea
                      value={this.state.params.intro}
                      placeholder="e.g., You will view a series of faces and houses. Press 1 when a face appears and 9 for a house. Press the the space bar on your keyboard to start doing the practice trials. If you want to skip the practice trials and go directly to the task, press the 'q' button on your keyboard."
                      onChange={(event) => {
                        const val = event.target.value;
                        if (!isString(val)) {
                          return;
                        }
                        this.setState({
                          params: { ...this.state.params, intro: val },
                          saved: false,
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>
            </div>

            <div
              className="w-2/3"
              style={{ display: 'grid', alignContent: 'space-between' }}
            >
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">Instructions for the task screen</h1>
                <p>
                  Edit the instruction that will be displayed in the footer
                  during the task.
                </p>
                <form>
                  <div className="mb-4">
                    <textarea
                      value={this.state.params.taskHelp}
                      placeholder="e.g., Press 1 for a face and 9 for a house"
                      onChange={(event) => {
                        const val = event.target.value;
                        if (!isString(val)) {
                          return;
                        }
                        this.setState({
                          params: { ...this.state.params, taskHelp: val },
                          saved: false,
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case CUSTOM_STEPS.PREVIEW:
        return (
          <div className={`flex gap-4 items-start ${styles.contentGrid}`}>
            <div
              className={`flex-1 ${styles.previewWindow}`}
              style={{ textAlign: 'right' }}
            >
              {this.props.type && (
                <PreviewExperimentComponent
                  isPreviewing={this.state.isPreviewing}
                  onEnd={this.endPreview}
                  type={this.props.type}
                  experimentObject={this.props.experimentObject}
                  // TODO: I believe this lets the user preview the parameter changes
                  // before saving them
                  params={this.state.params}
                  title={this.props.title}
                />
              )}
            </div>

            <div style={{ width: '10%' }}>
              <div className="p-4">
                <PreviewButton
                  isPreviewing={this.state.isPreviewing}
                  onClick={(e) => this.handlePreview(e)}
                />
              </div>
            </div>
          </div>
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
            <label className={`flex items-center gap-2 cursor-pointer ${styles.EEGToggle}`}>
              <input
                type="checkbox"
                defaultChecked={this.props.isEEGEnabled}
                onChange={(e) => this.handleEEGEnabled(e.target.checked)}
                className="w-4 h-4"
              />
            </label>
          }
          saveButton={
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium text-sm"
              onClick={() => {
                this.handleSaveParams();
              }}
            >
              {this.state.saved ? 'Save' : 'Save'}
            </button>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
