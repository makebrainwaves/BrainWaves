import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import HomeLanding, { HomeWorkspace } from './HomeLanding';
import WorkspaceNameDialog from './WorkspaceNameDialog';
import DeleteWorkspaceDialog from './DeleteWorkspaceDialog';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import { experimentLabel } from '../../constants/experimentLabels';
import { BANK_ROUTE, EXPLORE_ROUTE } from '../AppShell/areas';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
} from '../../utils/filesystem/storage';
import { ExperimentActions, PyodideActions } from '../../actions';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import { getExperimentFromType } from '../../utils/labjs/functions';

export interface Props {
  ExperimentActions: typeof ExperimentActions;
  navigate: (path: string) => void;
  PyodideActions: typeof PyodideActions;
}

/**
 * Home route: reads the workspace folders off disk and drives the pure
 * `HomeLanding` plus its naming and deletion dialogs. Owns the Pyodide launch
 * so the analysis runtime warms up while the user picks an experiment.
 */
export default function HomeScreen(props: Props) {
  const [workspaces, setWorkspaces] = useState<HomeWorkspace[]>([]);
  const [dirs, setDirs] = useState<string[]>([]);
  const [template, setTemplate] = useState<EXPERIMENTS | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function refresh() {
    const workspaceDirs = await readWorkspaces();
    const entries = (
      await Promise.all(
        workspaceDirs.map(async (dir) => ({
          dir,
          state: await readAndParseState(dir),
        }))
      )
    ).filter(
      (entry): entry is { dir: string; state: ExperimentStateType } =>
        entry.state != null
    );
    setDirs(workspaceDirs);
    setWorkspaces(
      entries
        .sort(
          (a, b) => (b.state.dateModified ?? 0) - (a.state.dateModified ?? 0)
        )
        .map(({ dir, state }) => ({
          name: dir,
          experimentType: experimentLabel(state.type),
          modality: state.isEEGEnabled ? 'eeg' : 'behavior',
          lastOpened: dayjs(state.dateModified ?? undefined).fromNow(),
        }))
    );
  }

  useEffect(() => {
    props.PyodideActions.Launch();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpen(dir: string) {
    const workspaceState = await readAndParseState(dir);
    if (workspaceState == null) {
      await deleteWorkspaceDir(dir);
      await refresh();
      toast(`Removed unreadable experiment "${dir}"`);
      return;
    }
    props.ExperimentActions.SetState({
      ...workspaceState,
      experimentObject: getExperimentFromType(workspaceState.type)
        .experimentObject,
    });
    props.navigate(SCREENS.DESIGN.route);
  }

  async function handleConfirmDelete(dir: string) {
    await deleteWorkspaceDir(dir);
    await refresh();
    setPendingDelete(null);
  }

  function handleCreate(type: EXPERIMENTS, title: string) {
    setTemplate(null);
    props.ExperimentActions.CreateNewWorkspace({ title, type });
    props.navigate(SCREENS.DESIGN.route);
  }

  return (
    <>
      <HomeLanding
        workspaces={workspaces}
        onOpen={handleOpen}
        onReveal={openWorkspaceDir}
        onDelete={setPendingDelete}
        onStartTemplate={setTemplate}
        onBrowseTemplates={() => props.navigate(BANK_ROUTE)}
        onExploreLive={() => props.navigate(EXPLORE_ROUTE)}
      />
      {template !== null && (
        <WorkspaceNameDialog
          templateName={experimentLabel(template)}
          baseName={template}
          existingNames={dirs}
          onCreate={(name) => handleCreate(template, name)}
          onCancel={() => setTemplate(null)}
        />
      )}
      {pendingDelete !== null && (
        <DeleteWorkspaceDialog
          workspaceName={pendingDelete}
          onConfirm={() => handleConfirmDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
