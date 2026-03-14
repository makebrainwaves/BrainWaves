import React, { Component } from 'react';
import { Button } from '../ui/button';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import { readWorkspaces } from '../../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import PreviewButton from '../PreviewButtonComponent';

import facesHousesOverview from '../../experiments/faces_houses/icon.png';
import stroopOverview from '../../experiments/stroop/icon.png';
import multitaskingOverview from '../../experiments/multitasking/icon.png';
import searchOverview from '../../experiments/search/icon.png';
import customOverview from '../../experiments/custom/icon.png';

import multiConditionShape from '../../experiments/multitasking/stimuli/multiConditionShape.png';
import multiConditionDots from '../../experiments/multitasking/stimuli/multiConditionDots.png';
import conditionFace from '../../experiments/faces_houses/stimuli/faces/Face1.jpg';
import conditionHouse from '../../experiments/faces_houses/stimuli/houses/House1.jpg';
import conditionOrangeT from '../../experiments/search/stimuli/conditionOrangeT.png';
import conditionNoOrangeT from '../../experiments/search/stimuli/conditionNoOrangeT.png';
import conditionCongruent from '../../experiments/stroop/stimuli/match_g.png';
import conditionIncongruent from '../../experiments/stroop/stimuli/mismatch6_r.png';

import InputModal from '../InputModal';
import { ExperimentActions } from '../../actions';
import { getExperimentFromType } from '../../utils/labjs/functions';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL',
  PREVIEW: 'PREVIEW',
};

export interface DesignProps {
  navigate: (path: string) => void;
  type: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  experimentObject: ExperimentObject;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
}

interface State {
  activeStep: string;
  isPreviewing: boolean;
  isNewExperimentModalOpen: boolean;
  recentWorkspaces: Array<string>;
}

export default class Design extends Component<DesignProps, State> {
  constructor(props: DesignProps) {
    super(props);
    this.state = {
      activeStep: DESIGN_STEPS.OVERVIEW,
      isPreviewing: false,
      isNewExperimentModalOpen: false,
      recentWorkspaces: [],
    };
    this.handleStepClick = this.handleStepClick.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleCustomizeExperiment = this.handleCustomizeExperiment.bind(this);
    this.handleLoadCustomExperiment = this.handleLoadCustomExperiment.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.endPreview = this.endPreview.bind(this);
    this.handleEEGEnabled = this.handleEEGEnabled.bind(this);
  }

  async componentDidMount() {
    this.setState({ recentWorkspaces: await readWorkspaces() });
  }

  handleStepClick(step: string) {
    this.setState({ activeStep: step });
  }

  handleStartExperiment() {
    this.props.navigate(SCREENS.COLLECT.route);
  }

  handleCustomizeExperiment() {
    this.setState({ isNewExperimentModalOpen: true });
  }

  handleLoadCustomExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    if (this.state.recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }
    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    this.props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
    });
    this.props.ExperimentActions.SaveWorkspace();
  }

  handlePreview(e) {
    e.target.blur();
    this.setState((prevState) => ({
      isPreviewing: !prevState.isPreviewing,
    }));
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handleEEGEnabled(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.ExperimentActions.SetEEGEnabled(e.target.checked);
    this.props.ExperimentActions.SaveWorkspace();
  }

  static renderConditionIcon(condition) {
    switch (condition) {
      case 'conditionCongruent': return conditionCongruent;
      case 'conditionIncongruent': return conditionIncongruent;
      case 'conditionOrangeT': return conditionOrangeT;
      case 'conditionNoOrangeT': return conditionNoOrangeT;
      case 'conditionFace': return conditionFace;
      case 'conditionHouse': return conditionHouse;
      case 'multiConditionShape': return multiConditionShape;
      case 'multiConditionDots':
      default: return multiConditionDots;
    }
  }

  static renderOverviewIcon(type: EXPERIMENTS) {
    switch (type) {
      case EXPERIMENTS.N170: return facesHousesOverview;
      case EXPERIMENTS.STROOP: return stroopOverview;
      case EXPERIMENTS.MULTI: return multitaskingOverview;
      case EXPERIMENTS.SEARCH: return searchOverview;
      case EXPERIMENTS.CUSTOM:
      default: return customOverview;
    }
  }

  renderSectionContent() {
    const {
      text: { overview, protocol, background },
    } = getExperimentFromType(this.props.type);

    switch (this.state.activeStep) {
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-5/12 p-2">
              <img src={Design.renderOverviewIcon(this.props.type)} alt={overview.title} />
            </div>
            <div className="w-7/12 p-2">
              <h1>{overview.title}</h1>
              <p>{overview.overview}</p>
            </div>
          </div>
        );

      case DESIGN_STEPS.BACKGROUND:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-1/4 p-2">
              <img src={Design.renderOverviewIcon(this.props.type)} alt="overview" />
            </div>
            <div className="w-5/12 p-2">
              <p>{background?.first_column_statement}</p>
              <p style={{ fontWeight: 'bold' }}>{background?.first_column_question}</p>
            </div>
            <div className="w-5/12 p-2">
              <p>{background?.second_column_statement}</p>
              <p style={{ fontWeight: 'bold' }}>{background?.second_column_question}</p>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-1 gap-2.5">
                {background?.links.map((link) => (
                  <Button
                    key={link.address}
                    variant="secondary"
                    onClick={() => { window.open(link.address, '_blank'); }}
                  >
                    {link.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case DESIGN_STEPS.PROTOCOL:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-7/12 p-2 text-left">
              <h2>{protocol?.title}</h2>
              <p>{protocol?.protocol}</p>
            </div>
            <div className="w-5/12 p-2 space-y-4">
              <div className="flex gap-2 items-center">
                <img
                  className="w-1/3"
                  src={Design.renderConditionIcon(protocol?.condition_first_img)}
                  alt={protocol?.condition_first_title}
                />
                <div className="w-2/3">
                  <h3>{protocol?.condition_first_title}</h3>
                  <p>{protocol?.condition_first}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <img
                  className="w-1/3"
                  src={Design.renderConditionIcon(protocol?.condition_second_img)}
                  alt={protocol?.condition_second_title}
                />
                <div className="w-2/3">
                  <h3>{protocol?.condition_second_title}</h3>
                  <p>{protocol?.condition_second}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case DESIGN_STEPS.PREVIEW:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-3/4 h-full border border-brand rounded">
              <PreviewExperimentComponent
                title={this.props.title}
                params={this.props.params}
                experimentObject={this.props.experimentObject}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
              />
            </div>
            <div className="w-1/4 flex justify-center">
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={this.handlePreview}
              />
            </div>
          </div>
        );
    }
  }

  render() {
    if (this.props.type === EXPERIMENTS.CUSTOM) {
      return <CustomDesign {...this.props} />;
    }
    return (
      <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
        <SecondaryNavComponent
          title="Experiment Design"
          steps={DESIGN_STEPS}
          activeStep={this.state.activeStep}
          onStepClick={this.handleStepClick}
          enableEEGToggle={
            <input
              type="checkbox"
              defaultChecked={this.props.isEEGEnabled}
              onChange={this.handleEEGEnabled}
              className="scale-75"
            />
          }
        />
        {this.renderSectionContent()}
        <InputModal
          open={this.state.isNewExperimentModalOpen}
          onClose={this.handleLoadCustomExperiment}
          onExit={() => this.setState({ isNewExperimentModalOpen: false })}
          header="Enter a title for this experiment"
        />
      </div>
    );
  }
}
