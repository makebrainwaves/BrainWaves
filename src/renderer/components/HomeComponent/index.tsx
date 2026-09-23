import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { EXPERIMENTS, SCREENS, FILE_TYPES } from '../../constants/constants';
import faceHouseIcon from '../../experiments/faces_houses/icon.png';
import stroopIcon from '../../experiments/stroop/icon.png';
import multitaskingIcon from '../../experiments/multitasking/icon.png';
import searchIcon from '../../experiments/search/icon.png';
import customIcon from '../../experiments/custom/icon.png';
import importIcon from '../../assets/common/importIcon.svg';
import {
  readWorkspaces,
  readAndParseState,
  deleteWorkspaceDir,
  importExperimentFile,
} from '../../utils/filesystem/storage';
import { ExperimentActions } from '../../actions';
import path from 'pathe';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { readFiles } from '../../utils/filesystem/read';
import { scanTimelineSource, V6_MIGRATION_URL } from '../../utils/jspsych/scan';
import { JSPSYCH_PLUGIN_GLOBALS } from '../../utils/jspsych/plugins';
import type { ImportedExperimentKind } from '../../constants/interfaces';
import { ExperimentCard } from './ExperimentCard';
import InputModal from '../InputModal';
import { getExperimentFromType } from '../../utils/labjs/functions';

export interface Props {
  ExperimentActions: typeof ExperimentActions;
  navigate: (path: string) => void;
}

/**
 * Experiment bank: the ready-made templates, the custom builder and importing
 * an externally-authored jsPsych/lab.js timeline. Rendered inside `AppShell`.
 */
export default function Home(props: Props) {
  const [recentWorkspaces, setRecentWorkspaces] = useState<Array<string>>([]);
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] =
    useState(false);

  useEffect(() => {
    let cancelled = false;
    readWorkspaces().then((workspaces) => {
      if (!cancelled) setRecentWorkspaces(workspaces);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleNewExperiment(experimentType: EXPERIMENTS) {
    if (experimentType === EXPERIMENTS.CUSTOM) {
      setIsNewExperimentModalOpen(true);
    } else if (recentWorkspaces.includes(experimentType)) {
      handleLoadRecentWorkspace(experimentType);
    } else {
      props.ExperimentActions.CreateNewWorkspace({
        title: experimentType,
        type: experimentType,
      });
      props.navigate(SCREENS.DESIGN.route);
    }
  }

  function handleLoadCustomExperiment(title: string) {
    title = title.replace(/ /g, '_');
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
    props.navigate(SCREENS.DESIGN.route);
  }

  async function handleImportExperiment() {
    const sourcePath = await loadFromSystemDialog(FILE_TYPES.TIMELINE);
    if (!sourcePath) return;

    const kind: ImportedExperimentKind =
      path.extname(sourcePath).toLowerCase() === '.json' ? 'labjs' : 'jspsych';
    const title = path.parse(sourcePath).name.replace(/[^\w-]/g, '_');

    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    if (recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }

    // Scan the ORIGINAL file: a rejected import must not leave a workspace
    // behind to clean up.
    if (kind === 'jspsych') {
      const [source] = await readFiles([sourcePath]);
      const scan = scanTimelineSource(
        source,
        Object.keys(JSPSYCH_PLUGIN_GLOBALS)
      );
      if (scan.v6Token) {
        toast.error(
          `This file is written for jsPsych 6 (it uses ${scan.v6Token}). BrainWaves runs jsPsych 8. Migration guide: ${V6_MIGRATION_URL}`
        );
        return;
      }
      if (scan.missingPluginGlobals.length > 0) {
        toast.error(
          `This experiment uses plugins BrainWaves does not ship: ${scan.missingPluginGlobals.join(
            ', '
          )}`
        );
        return;
      }
    }

    const { file } = await importExperimentFile(title, sourcePath);
    props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.IMPORTED,
      imported: {
        kind,
        file,
        conditionKey: '',
        correctKey: '',
        conditionLabels: [],
      },
    });
    props.navigate(SCREENS.DESIGN.route);
  }

  async function handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState == null) {
      await deleteWorkspaceDir(dir);
      setRecentWorkspaces(await readWorkspaces());
      toast(`Removed unreadable experiment "${dir}"`);
      return;
    }
    props.ExperimentActions.SetState({
      ...recentWorkspaceState,
      experimentObject: getExperimentFromType(recentWorkspaceState.type)
        .experimentObject,
    });
    props.navigate(SCREENS.DESIGN.route);
  }

  return (
    <div className="flex flex-col gap-7 p-8" data-tid="container">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-bold tracking-[0.5px] text-ink-muted">
          READY-MADE EXPERIMENTS
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ExperimentCard
            onClick={() => handleNewExperiment(EXPERIMENTS.N170)}
            icon={faceHouseIcon}
            title="Faces/Houses"
            description={`Explore how people react to different kinds of
                          images, like faces vs. houses.`}
          />
          <ExperimentCard
            onClick={() => handleNewExperiment(EXPERIMENTS.STROOP)}
            icon={stroopIcon}
            title="Stroop"
            description={`Investigate why it is hard to deal with
                          contradictory information (like the word "RED"
                          printed in blue).`}
          />
          <ExperimentCard
            onClick={() => handleNewExperiment(EXPERIMENTS.MULTI)}
            icon={multitaskingIcon}
            title="Multi-tasking"
            description={`Explore why it is challenging to carry out multiple
                          tasks at the same time.`}
          />
          <ExperimentCard
            onClick={() => handleNewExperiment(EXPERIMENTS.SEARCH)}
            icon={searchIcon}
            title="Visual Search"
            description={`Examine why it is difficult to find your keys in a
                          messy room.`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-sm font-bold tracking-[0.5px] text-ink-muted">
          BUILD YOUR OWN
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ExperimentCard
            onClick={() => handleNewExperiment(EXPERIMENTS.CUSTOM)}
            icon={customIcon}
            title="Experiment Builder"
            description={`Design your own image experiment. Choose
                          condition folders and key responses.`}
          />
          <ExperimentCard
            onClick={handleImportExperiment}
            icon={importIcon}
            title="Import Experiment"
            description={`Already have a jsPsych timeline or a lab.js study?
                          Run it here, with EEG markers and analysis.`}
          />
        </div>
      </div>

      <InputModal
        open={isNewExperimentModalOpen}
        onClose={handleLoadCustomExperiment}
        onExit={() => setIsNewExperimentModalOpen(false)}
        header="Enter a title for this experiment"
      />
    </div>
  );
}
