import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import { readWorkspaces } from '../../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../../constants/interfaces';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PrepareSteps, { PrepareStepId } from '../PrepareSteps/PrepareSteps';
import CustomDesign from './CustomDesignComponent';
import ImportedDesign from './ImportedDesignComponent';
import InputModal from '../InputModal';
import { ExperimentActions } from '../../actions';
import { getExperimentFromType } from '../../utils/labjs/functions';

export interface DesignProps {
  navigate: (path: string) => void;
  type: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  experimentObject: ExperimentObject;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
}

/**
 * The Prepare area's Design screen. Built-in experiments walk the approved
 * `PrepareSteps` lesson (Overview → Background → Protocol → Preview) from
 * their `prepare.ts`; experiments without one (Custom, Imported) keep their
 * own authoring flows.
 */
export default function Design(props: DesignProps) {
  const [activeStep, setActiveStep] = useState<PrepareStepId>('overview');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] =
    useState(false);
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    readWorkspaces().then((workspaces) => {
      if (!cancelled) setRecentWorkspaces(workspaces);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { prepare } = getExperimentFromType(props.type);

  if (!prepare) {
    return props.type === EXPERIMENTS.CUSTOM ? (
      <CustomDesign {...props} />
    ) : (
      <ImportedDesign {...props} />
    );
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

  function handleEEGEnabled(enabled: boolean) {
    props.ExperimentActions.SetEEGEnabled(enabled);
    props.ExperimentActions.SaveWorkspace();
  }

  return (
    <>
      <PrepareSteps
        {...prepare}
        step={activeStep}
        onStep={setActiveStep}
        isEEGEnabled={props.isEEGEnabled}
        onEEGEnabledChange={handleEEGEnabled}
        onCustomize={() => setIsNewExperimentModalOpen(true)}
        onCollect={() => props.navigate(SCREENS.COLLECT.route)}
        onPreviewStart={() => {
          setIsPreviewing(true);
          setHasPreviewed(true);
        }}
        onPreviewStop={() => setIsPreviewing(false)}
        onPreviewAgain={() => setIsPreviewing(true)}
        isPreviewing={isPreviewing}
        hasPreviewed={hasPreviewed}
        preview={
          <PreviewExperimentComponent
            title={props.title}
            params={props.params}
            experimentObject={props.experimentObject}
            isPreviewing={isPreviewing}
            onEnd={() => setIsPreviewing(false)}
            type={props.type}
          />
        }
      />
      <InputModal
        open={isNewExperimentModalOpen}
        onClose={handleLoadCustomExperiment}
        onExit={() => setIsNewExperimentModalOpen(false)}
        header="Enter a title for this experiment"
      />
    </>
  );
}
