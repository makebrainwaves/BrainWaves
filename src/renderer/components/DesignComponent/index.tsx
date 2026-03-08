import React, { Component } from 'react';
import { History } from 'history';
import { isNil } from 'lodash';
import { toast } from 'react-toastify';
import styles from '../styles/common.module.css';
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

// conditions images
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
  history: History;
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
    this.handleLoadCustomExperiment =
      this.handleLoadCustomExperiment.bind(this);
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
    this.props.history.push(SCREENS.COLLECT.route);
  }

  handleCustomizeExperiment() {
    this.setState({
      isNewExperimentModalOpen: true,
    });
  }

  handleLoadCustomExperiment(title: string) {
    this.setState({ isNewExperimentModalOpen: false });
    // Don't create new workspace if it already exists or title is too short
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

  handleEEGEnabled(checked: boolean) {
    this.props.ExperimentActions.SetEEGEnabled(checked);
    this.props.ExperimentActions.SaveWorkspace();
  }

  static renderConditionIcon(condition) {
    switch (condition) {
      case 'conditionCongruent':
        return conditionCongruent;
      case 'conditionIncongruent':
        return conditionIncongruent;
      case 'conditionOrangeT':
        return conditionOrangeT;
      case 'conditionNoOrangeT':
        return conditionNoOrangeT;
      case 'conditionFace':
        return conditionFace;
      case 'conditionHouse':
        return conditionHouse;
      case 'multiConditionShape':
        return multiConditionShape;
      case 'multiConditionDots':
      default:
        return multiConditionDots;
    }
  }

  static renderOverviewIcon(type: EXPERIMENTS) {
    switch (type) {
      case EXPERIMENTS.N170:
        return facesHousesOverview;
      case EXPERIMENTS.STROOP:
        return stroopOverview;
      case EXPERIMENTS.MULTI:
        return multitaskingOverview;
      case EXPERIMENTS.SEARCH:
        return searchOverview;
      case EXPERIMENTS.CUSTOM:
      default:
        return customOverview;
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
          <div
            className={`flex gap-4 items-center ${styles.contentGrid}`}
            style={{ alignItems: 'center' }}
          >
            <div className="flex gap-4 items-start w-full">
              <div className="flex-1" style={{ flexBasis: '5/16' }}>
                <div className="p-4">
                  <img
                    src={Design.renderOverviewIcon(this.props.type)}
                    className="max-w-full"
                  />
                </div>
              </div>

              <div className="flex-1" style={{ flexBasis: '11/16' }}>
                <div className="p-4">
                  <h1 className="text-2xl font-bold mb-2">{overview.title}</h1>
                  <p>{overview.overview}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case DESIGN_STEPS.BACKGROUND:
        return (
          <div
            className={`${styles.contentGrid}`}
            style={{ alignItems: 'center' }}
          >
            <div className="flex gap-4 items-start w-full">
              <div style={{ width: '25%' }}>
                <div className="p-4">
                  <img
                    src={Design.renderOverviewIcon(this.props.type)}
                    className="max-w-full"
                  />
                </div>
              </div>

              <div style={{ width: '31.25%' }}>
                <div className="p-4">
                  <p>{background?.first_column_statement}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {background?.first_column_question}
                  </p>
                </div>
              </div>

              <div style={{ width: '31.25%' }}>
                <div className="p-4">
                  <p>{background?.second_column_statement}</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {background?.second_column_question}
                  </p>
                </div>
              </div>

              <div style={{ width: '12.5%' }}>
                <div className="p-4">
                  <div className={styles.externalLinks}>
                    {background?.links.map((link) => (
                      <button
                        key={link.address}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
                        onClick={() => {
                          window.open(link.address, '_blank');
                        }}
                      >
                        {link.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case DESIGN_STEPS.PROTOCOL:
        return (
          <div
            className={`${styles.contentGrid}`}
            style={{ alignItems: 'center' }}
          >
            <div className="flex gap-4 items-start w-full">
              <div style={{ width: '43.75%', textAlign: 'left' }}>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{protocol?.title}</h2>
                  <p>{protocol?.protocol}</p>
                </div>
              </div>

              <div style={{ width: '56.25%' }}>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-start">
                    <div style={{ width: '31.25%' }}>
                      <img
                        src={Design.renderConditionIcon(
                          protocol?.condition_first_img
                        )}
                        className="max-w-full"
                      />
                    </div>
                    <div style={{ width: '62.5%' }}>
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-1">
                          {protocol?.condition_first_title}
                        </h3>
                        <p>{protocol?.condition_first}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div style={{ width: '31.25%' }}>
                      <img
                        src={Design.renderConditionIcon(
                          protocol?.condition_second_img
                        )}
                        className="max-w-full"
                      />
                    </div>
                    <div style={{ width: '62.5%' }}>
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-1">
                          {protocol?.condition_second_title}
                        </h3>
                        <p>{protocol?.condition_second}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case DESIGN_STEPS.PREVIEW:
        return (
          <div className={`flex gap-4 items-start ${styles.contentGrid}`}>
            <div
              className={`${styles.previewWindow}`}
              style={{ flex: '0 0 75%', textAlign: 'right' }}
            >
              <PreviewExperimentComponent
                title={this.props.title}
                params={this.props.params}
                experimentObject={this.props.experimentObject}
                isPreviewing={this.state.isPreviewing}
                onEnd={this.endPreview}
                type={this.props.type}
              />
            </div>
            <div style={{ flex: '0 0 25%', display: 'flex', alignItems: 'center' }}>
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
      <div className={styles.mainContainer}>
        <SecondaryNavComponent
          title="Experiment Design"
          steps={DESIGN_STEPS}
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
