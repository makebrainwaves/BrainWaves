import React, { Component } from 'react';
import { Button } from '../ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { isString } from 'lodash';

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

  handleProgressBar(e: React.ChangeEvent<HTMLInputElement>) {
    const { checked } = e.target;
    this.setState((prevState) => ({
      params: { ...prevState.params, showProgessBar: checked },
    }));
  }

  handleEEGEnabled(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.ExperimentActions.SetEEGEnabled(e.target.checked);
  }

  handleStartExperiment() {
    this.props.navigate(SCREENS.COLLECT.route);
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
          <div className="flex gap-4 p-4 h-[90%]">
            <div className="flex-1 flex flex-col items-center">
              <img
                src={researchQuestionImage}
                className="h-[140px] w-auto"
                alt="Research Question"
              />
              <label className="block text-sm font-medium mb-1">
                {FIELDS.QUESTION}
              </label>
              <textarea
                style={{ minHeight: 100, maxHeight: 400 }}
                className="w-full border border-gray-300 rounded p-2"
                value={this.state.params.description?.question}
                placeholder="Explain your research question here."
                onChange={(event) =>
                  this.handleSetText(event.target.value, 'question')
                }
              />
            </div>
            <div className="flex-1 flex flex-col items-center">
              <img
                src={hypothesisImage}
                className="h-[140px] w-auto"
                alt="Hypothesis"
              />
              <label className="block text-sm font-medium mb-1">
                {FIELDS.HYPOTHESIS}
              </label>
              <textarea
                style={{ minHeight: 100, maxHeight: 400 }}
                className="w-full border border-gray-300 rounded p-2"
                value={this.state.params.description?.hypothesis}
                placeholder="Describe your hypothesis here."
                onChange={(event) =>
                  this.handleSetText(event.target.value, 'hypothesis')
                }
              />
            </div>
            <div className="flex-1 flex flex-col items-center">
              <img
                src={methodsImage}
                className="h-[140px] w-auto"
                alt="Methods"
              />
              <label className="block text-sm font-medium mb-1">
                {FIELDS.METHODS}
              </label>
              <textarea
                style={{ minHeight: 100, maxHeight: 400 }}
                className="w-full border border-gray-300 rounded p-2"
                value={this.state.params.description?.methods}
                placeholder="Explain how you will design your experiment to answer the question here."
                onChange={(event) =>
                  this.handleSetText(event.target.value, 'methods')
                }
              />
            </div>
          </div>
        );

      case CUSTOM_STEPS.CONDITIONS:
        return (
          <div className="p-4">
            <div className="mb-4">
              <h1>Conditions</h1>
              <p>
                {`Select the folder with images for each condition and choose
                the correct response. You can upload image files with the
                following extensions: ".png", ".jpg", ".jpeg". Make sure when
                you preview your experiment that the resolution is high enough.
                You can resize or compress your images in an image editing
                program or on one of the websites online.`}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[60px]">Condition</TableHead>
                  <TableHead>Default Key Response</TableHead>
                  <TableHead>Condition Folder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3}>
                    Stimulus customization is currently unavailable
                  </TableCell>
                </TableRow>
                {stimi.map(({ name, number }) => (
                  <TableRow key={name}>
                    <TableCell
                      colSpan={3}
                    >{`Stimulus name: ${name}, number: ${number}`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case CUSTOM_STEPS.TRIALS:
        return (
          <div className="p-4">
            <div className="grid grid-cols-[auto_1fr] w-full">
              <div>
                <h1>Trials</h1>
                <p>Edit the correct key response and type of each trial.</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 self-end justify-self-end">
                <div>
                  <label htmlFor="trial-order" className="block text-sm mb-1">Order</label>
                  <select
                    id="trial-order"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={this.state.params.randomize}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (val === 'sequential' || val === 'random') {
                        this.setState({
                          params: { ...this.state.params, randomize: val },
                          saved: false,
                        });
                      }
                    }}
                  >
                    <option value="random">Random</option>
                    <option value="sequential">Sequential</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nb-trials" className="block text-sm mb-1">
                    Total experimental trials
                  </label>
                  <input
                    id="nb-trials"
                    type="number"
                    className="border border-gray-300 rounded px-2 py-1"
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
                  />
                </div>
                <div>
                  <label htmlFor="nb-practice-trials" className="block text-sm mb-1">
                    Total practice trials
                  </label>
                  <input
                    id="nb-practice-trials"
                    type="number"
                    className="border border-gray-300 rounded px-2 py-1"
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
                  />
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[60px]">Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Correct Key Response</TableHead>
                  <TableHead>Trial Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-y-scroll max-h-[50vh] block">
                <TableRow>
                  <TableCell colSpan={4}>
                    Stimulus customization is currently unavailable
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );

      case CUSTOM_STEPS.PARAMETERS:
        return (
          <div className="flex gap-4 p-4">
            <div className="w-1/2 flex flex-col justify-between">
              <div>
                <h1>Inter-trial interval</h1>
                <p>
                  Select the inter-trial interval duration. This is the amount
                  of time between trials measured from the end of one trial to
                  the start of the next one.
                </p>
              </div>
              <div style={{ marginTop: '100px' }}>
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
            <div className="w-1/2 flex flex-col justify-between">
              <div>
                <h1>Image duration</h1>
                <p>
                  Select the time of presentation or make it self-paced -
                  present the image until participants respond.
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={this.state.params.selfPaced}
                    onChange={() =>
                      this.setState({
                        params: {
                          ...this.state.params,
                          selfPaced: !this.state.params.selfPaced,
                        },
                        saved: false,
                      })
                    }
                  />
                  Self-paced data collection
                </label>
              </div>
              {!this.state.params.selfPaced ? (
                <div>
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
                <div style={{ marginBottom: '85px' }} />
              )}
            </div>
          </div>
        );

      case CUSTOM_STEPS.INSTRUCTIONS:
        return (
          <div className="flex gap-4 p-4">
            <div className="w-1/2">
              <h1>Experiment Instructions</h1>
              <p>
                Edit the instruction that will be displayed on the first screen.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                style={{ minHeight: 150 }}
                value={this.state.params.intro}
                placeholder="e.g., You will view a series of faces and houses. Press 1 when a face appears and 9 for a house."
                onChange={(event) => {
                  const val = event.target.value;
                  if (!isString(val)) return;
                  this.setState({
                    params: { ...this.state.params, intro: val },
                    saved: false,
                  });
                }}
              />
            </div>
            <div className="w-1/2">
              <h1>Instructions for the task screen</h1>
              <p>
                Edit the instruction that will be displayed in the footer during
                the task.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                style={{ minHeight: 150 }}
                value={this.state.params.taskHelp}
                placeholder="e.g., Press 1 for a face and 9 for a house"
                onChange={(event) => {
                  const val = event.target.value;
                  if (!isString(val)) return;
                  this.setState({
                    params: { ...this.state.params, taskHelp: val },
                    saved: false,
                  });
                }}
              />
            </div>
          </div>
        );

      case CUSTOM_STEPS.PREVIEW:
        return (
          <div className="flex items-start p-4 h-[90%]">
            <div className="flex-1 h-full border border-brand rounded">
              {this.props.type && (
                <PreviewExperimentComponent
                  isPreviewing={this.state.isPreviewing}
                  onEnd={this.endPreview}
                  type={this.props.type}
                  experimentObject={this.props.experimentObject}
                  params={this.state.params}
                  title={this.props.title}
                />
              )}
            </div>
            <div className="flex-shrink-0 p-2">
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={(e) => this.handlePreview(e)}
              />
            </div>
          </div>
        );
    }
  }

  render() {
    return (
      <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
        <SecondaryNavComponent
          title="Experiment Design"
          steps={CUSTOM_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          enableEEGToggle={
            <input
              type="checkbox"
              defaultChecked={this.props.isEEGEnabled}
              onChange={(event) => this.handleEEGEnabled(event)}
              className="scale-75"
            />
          }
          saveButton={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => this.handleSaveParams()}
            >
              Save
            </Button>
          }
        />
        {this.renderSectionContent()}
      </div>
    );
  }
}
