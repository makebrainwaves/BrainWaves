import React, { useState, useEffect } from 'react';
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

function renderConditionIcon(condition) {
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

function renderOverviewIcon(type: EXPERIMENTS) {
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

export default function Design(props: DesignProps) {
  const [activeStep, setActiveStep] = useState(DESIGN_STEPS.OVERVIEW);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] = useState(false);
  const [recentWorkspaces, setRecentWorkspaces] = useState<Array<string>>([]);

  useEffect(() => {
    let cancelled = false;
    readWorkspaces().then((workspaces) => {
      if (!cancelled) setRecentWorkspaces(workspaces);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (props.type === EXPERIMENTS.CUSTOM) {
    return <CustomDesign {...props} />;
  }

  function handleStepClick(step: string) {
    setActiveStep(step);
  }

  function handleStartExperiment() {
    props.navigate(SCREENS.COLLECT.route);
  }

  function handleCustomizeExperiment() {
    setIsNewExperimentModalOpen(true);
  }

  function handleLoadCustomExperiment(title: string) {
    setIsNewExperimentModalOpen(false);
    if (recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }
    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
    });
    props.ExperimentActions.SaveWorkspace();
  }

  function handlePreview(e) {
    e.target.blur();
    setIsPreviewing((prev) => !prev);
  }

  function endPreview() {
    setIsPreviewing(false);
  }

  function handleEEGEnabled(e: React.ChangeEvent<HTMLInputElement>) {
    props.ExperimentActions.SetEEGEnabled(e.target.checked);
    props.ExperimentActions.SaveWorkspace();
  }

  function renderSectionContent() {
    const {
      text: { overview, protocol, background },
    } = getExperimentFromType(props.type);

    switch (activeStep) {
      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-5/12 p-2">
              <img
                src={renderOverviewIcon(props.type)}
                alt={overview.title}
              />
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
              <img
                src={renderOverviewIcon(props.type)}
                alt="overview"
              />
            </div>
            <div className="w-5/12 p-2">
              <p>{background?.first_column_statement}</p>
              <p style={{ fontWeight: 'bold' }}>
                {background?.first_column_question}
              </p>
            </div>
            <div className="w-5/12 p-2">
              <p>{background?.second_column_statement}</p>
              <p style={{ fontWeight: 'bold' }}>
                {background?.second_column_question}
              </p>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-1 gap-2.5">
                {background?.links.map((link) => (
                  <Button
                    key={link.address}
                    variant="secondary"
                    onClick={() => {
                      window.open(link.address, '_blank');
                    }}
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
                  src={renderConditionIcon(
                    protocol?.condition_first_img
                  )}
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
                  src={renderConditionIcon(
                    protocol?.condition_second_img
                  )}
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
                title={props.title}
                params={props.params}
                experimentObject={props.experimentObject}
                isPreviewing={isPreviewing}
                onEnd={endPreview}
                type={props.type}
              />
            </div>
            <div className="w-1/4 flex justify-center">
              <PreviewButton
                isPreviewing={isPreviewing}
                onClick={handlePreview}
              />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      <SecondaryNavComponent
        title="Experiment Design"
        steps={DESIGN_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        enableEEGToggle={
          <input
            type="checkbox"
            defaultChecked={props.isEEGEnabled}
            onChange={handleEEGEnabled}
            className="scale-75"
          />
        }
      />
      {renderSectionContent()}
      <InputModal
        open={isNewExperimentModalOpen}
        onClose={handleLoadCustomExperiment}
        onExit={() => setIsNewExperimentModalOpen(false)}
        header="Enter a title for this experiment"
      />
    </div>
  );
}