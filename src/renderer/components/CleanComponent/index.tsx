import React, { useEffect, useRef, useState } from 'react';
import path from 'pathe';
import { memoize } from 'lodash';
import { toast } from 'react-toastify';
import { PTP_THRESHOLD, SCREENS } from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { resolveMarkerRegistry } from '../../utils/eeg/markerRegistry';
import {
  deleteIncompleteRecording,
  readWorkspaceIncompleteEEGData,
  readWorkspaceRawEEGData,
} from '../../utils/filesystem/storage';
import { AREA_ROUTES } from '../AppShell/areas';
import CleanDatasetSelect from '../Clean/CleanDatasetSelect';
import CleanReview, { CleanConfirm, SaveState } from '../Clean/CleanReview';
import { PrimerStep } from '../Clean/CleanPrimer';
import type { RawRecording } from '../Clean/fixtures';
import {
  PyodideActions,
  ExperimentActions,
  EpochArraysMeta,
  EpochInfoRow,
  SuggestedRejection,
} from '../../actions';

// Memoized by params reference so we don't rebuild the registry every render.
const codeToLabelFor = memoize(
  (params: ExperimentParameters | null | undefined) =>
    resolveMarkerRegistry(params).codeToLabel
);

export interface Props {
  title: string;

  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  PyodideActions: typeof PyodideActions;
  ExperimentActions: typeof ExperimentActions;
  params: ExperimentParameters | null;
  suggestedRejections: SuggestedRejection[];
  cleanedEpochsSave: { revision: number; ok: boolean };
  navigate: (route: string) => void;
}

/**
 * The Clean screen: pick one complete raw recording (`CleanDatasetSelect`),
 * then leave out trials, flag sensors, accept or restore auto-flag suggestions
 * and save a cleaned copy (`CleanReview`). Owns exclusion, confirmation and
 * save state; loading, cleaning and the disk write go through `PyodideActions`.
 */
export default function Clean(props: Props) {
  const { epochArrays, cleanedEpochsSave, navigate } = props;
  const [view, setView] = useState<'select' | 'review'>('select');
  const [recordings, setRecordings] = useState<RawRecording[]>([]);
  /** Bumped to list the workspace's recordings again (after a delete). */
  const [listRevision, setListRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [deletingRecording, setDeletingRecording] =
    useState<RawRecording | null>(null);
  /** ABSOLUTE indices into `rejectedFor`, including accepted suggestions. */
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  /** The arrays `rejected` indexes; arrays are re-fetched after every load and save, which invalidates the indices. */
  const [rejectedFor, setRejectedFor] = useState(epochArrays);
  /** Channel names stay valid across saves, so the flags persist and each save sends the full set. */
  const [badChannels, setBadChannels] = useState<Set<string>>(new Set());
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(
    PTP_THRESHOLD.default
  );
  const [saveState, setSaveState] = useState<SaveState>('idle');
  /** Where a settled save goes: stay on Clean, or on to Analyze. */
  const destination = useRef<'clean' | 'analyze'>('clean');
  const [confirm, setConfirm] = useState<CleanConfirm | null>(null);
  const [primerOpen, setPrimerOpen] = useState(true);
  const [primerStep, setPrimerStep] = useState<PrimerStep>(1);
  const prevRevision = useRef(cleanedEpochsSave.revision);

  if (rejectedFor !== epochArrays) {
    setRejectedFor(epochArrays);
    setRejected(new Set());
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [raw, incomplete] = await Promise.all([
        readWorkspaceRawEEGData(props.title),
        readWorkspaceIncompleteEEGData(props.title),
      ]);
      if (cancelled) return;
      const listed: Array<{
        file: { name: string; path: string };
        incomplete: boolean;
      }> = [
        ...raw.map((file) => ({ file, incomplete: false })),
        ...incomplete.map((file) => ({ file, incomplete: true })),
      ];
      setRecordings(
        listed.map(({ file, incomplete: isIncomplete }) => {
          const segments = file.path.split(path.sep);
          return {
            key: file.path,
            name: file.name,
            subject: segments[segments.length - 3],
            incomplete: isIncomplete,
          };
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [props.title, listRevision]);

  useEffect(() => {
    if (cleanedEpochsSave.revision === prevRevision.current) return;
    prevRevision.current = cleanedEpochsSave.revision;
    if (!cleanedEpochsSave.ok) {
      setSaveState('failed');
    } else if (destination.current === 'analyze') {
      navigate(SCREENS.ANALYZE.route);
    } else {
      setSaveState('saved');
    }
  }, [cleanedEpochsSave, navigate]);

  const chosen = recordings.find((r) => r.key === selected) ?? null;
  const total = epochArrays?.meta.n_epochs ?? 0;
  const allRejected = total > 0 && rejected.size >= total;
  const status =
    epochArrays === null
      ? 'loading'
      : epochArrays.meta.n_epochs === 0
        ? 'no-epochs'
        : 'ready';
  const saving = saveState === 'saving';

  /** Any exclusion edit makes a finished save stale and retires the primer. */
  function edited() {
    setSaveState((state) => (state === 'saving' ? state : 'idle'));
    setPrimerOpen(false);
  }

  /** Cleans the worker's current epochs, then saves them; `dropIndices` index those epochs. */
  function save(dropIndices: number[]) {
    props.PyodideActions.CleanEpochs({
      dropIndices,
      badChannels: [...badChannels],
    });
    setSaveState('saving');
  }

  function handleStart() {
    if (!chosen) return;
    props.ExperimentActions.SetSubject(chosen.subject);
    props.PyodideActions.LoadEpochs(chosen.key);
    setBadChannels(new Set());
    setSaveState('idle');
    setView('review');
  }

  async function handleDeleteConfirm() {
    if (!deletingRecording) return;
    const { key, name } = deletingRecording;
    setDeletingRecording(null);
    try {
      await deleteIncompleteRecording(props.title, key);
    } catch (e) {
      toast.error(`Couldn't delete ${name}: ${(e as Error).message}`);
    }
    setListRevision((n) => n + 1);
  }

  function handleToggleChannel(name: string) {
    if (saving) return;
    edited();
    const next = new Set(badChannels);
    const adding = !next.delete(name);
    if (adding) next.add(name);
    setBadChannels(next);
    if (adding && next.size > 1 && epochArrays?.meta.n_channels === 4) {
      setConfirm('dropChannels');
    }
  }

  function handleApply() {
    destination.current = 'clean';
    if (allRejected) {
      setConfirm('rejectAll');
    } else {
      save([...rejected]);
    }
  }

  function handleSave() {
    destination.current = 'analyze';
    if (allRejected) {
      setConfirm('rejectAll');
    } else if (rejected.size > 0) {
      setConfirm('removeSelected');
    } else if (badChannels.size > 0) {
      setConfirm('applyChannels');
    } else {
      save([]);
    }
  }

  function handleConfirmAccept() {
    setConfirm(null);
    if (confirm !== 'dropChannels') save([...rejected]);
  }

  if (view === 'select') {
    return (
      <CleanDatasetSelect
        recordings={recordings}
        selected={selected}
        onSelectChange={setSelected}
        showIncomplete={showIncomplete}
        onShowIncompleteChange={setShowIncomplete}
        deletingRecording={deletingRecording}
        onDeleteRequest={setDeletingRecording}
        onDeleteConfirm={() => void handleDeleteConfirm()}
        onDeleteCancel={() => setDeletingRecording(null)}
        onStart={handleStart}
      />
    );
  }

  return (
    <CleanReview
      dataset={{
        subject: chosen?.subject ?? '',
        recording: chosen?.name ?? '',
      }}
      epochArrays={epochArrays}
      status={status}
      codeToLabel={codeToLabelFor(props.params)}
      rejected={rejected}
      badChannels={badChannels}
      onToggleEpoch={(index) => {
        if (saving) return;
        edited();
        setRejected((prev) => {
          const next = new Set(prev);
          if (!next.delete(index)) next.add(index);
          return next;
        });
      }}
      onToggleChannel={handleToggleChannel}
      autoFlagThreshold={autoFlagThreshold}
      onThresholdChange={setAutoFlagThreshold}
      suggestions={props.suggestedRejections.map((s) => ({
        ...s,
        accepted: rejected.has(s.index),
      }))}
      onAcceptSuggestion={(index) => {
        edited();
        setRejected((prev) => new Set(prev).add(index));
      }}
      onRestoreSuggestion={(index) => {
        edited();
        setRejected((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }}
      onSuggest={() =>
        props.PyodideActions.GetSuggestedRejections(autoFlagThreshold)
      }
      saveState={saveState}
      onApply={handleApply}
      onSave={handleSave}
      onRetrySave={() => save([])}
      onGoToAnalyze={() => navigate(SCREENS.ANALYZE.route)}
      onGoToCollect={() => navigate(AREA_ROUTES.collect)}
      onBackToSelection={() => setView('select')}
      confirm={confirm}
      onConfirmAccept={handleConfirmAccept}
      onConfirmCancel={() => setConfirm(null)}
      primerOpen={primerOpen}
      primerStep={primerStep}
      onPrimerOpenChange={setPrimerOpen}
      onPrimerStepChange={setPrimerStep}
    />
  );
}
