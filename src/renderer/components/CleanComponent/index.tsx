import React, { useEffect, useState } from 'react';
import path from 'pathe';
import { Link } from 'react-router-dom';
import { isNil, isString, memoize } from 'lodash';
import { Button } from '../ui/button';
import {
  EXPERIMENTS,
  DEVICES,
  PTP_THRESHOLD,
} from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { buildMarkerRegistry } from '../../utils/eeg/markerRegistry';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import EpochReviewer from './EpochReviewer';
import LiveErpPane from './LiveErpPane';
import {
  PyodideActions,
  ExperimentActions,
  EpochArraysMeta,
  SuggestedRejection,
} from '../../actions';

// Memoized by stimuli reference so we don't rebuild the registry every render.
const codeToLabelFor = memoize(
  (stimuli: ExperimentParameters['stimuli']) =>
    buildMarkerRegistry(stimuli).codeToLabel
);

export interface Props {
  type?: EXPERIMENTS;
  title: string;
  deviceType: DEVICES;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  PyodideActions: typeof PyodideActions;
  ExperimentActions: typeof ExperimentActions;
  subject: string;
  session: number;
  params: ExperimentParameters | null;
  suggestedRejections: SuggestedRejection[];
}

interface DropdownOption {
  key: string;
  text: string;
  value: string;
}

export default function Clean(props: Props) {
  const [view, setView] = useState<'select' | 'review'>('select');
  const [subjects, setSubjects] = useState<Array<DropdownOption>>([]);
  const [eegFilePaths, setEegFilePaths] = useState<Array<DropdownOption>>([
    { key: '', text: '', value: '' },
  ]);
  const [selectedSubject, setSelectedSubject] = useState(props.subject);
  const [selectedFilePaths, setSelectedFilePaths] = useState<Array<string>>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [rejectedEpochs, setRejectedEpochs] = useState<Set<number>>(new Set());
  const [badChannels, setBadChannels] = useState<Set<string>>(new Set());
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(
    PTP_THRESHOLD.default
  );
  const [showAutoFlagSettings, setShowAutoFlagSettings] = useState(false);
  const [icons] = useState(() =>
    props.type === EXPERIMENTS.N170
      ? ['😊', '🏠', '✕', '📖']
      : ['★', '☆', '✕', '📖']
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const workspaceRawData = await readWorkspaceRawEEGData(props.title);
      if (cancelled) return;
      setSubjects(
        workspaceRawData
          .map(
            (filepath) =>
              filepath.path.split(path.sep)[
                filepath.path.split(path.sep).length - 3
              ]
          )
          .reduce((acc, curr) => {
            if (acc.find((subject) => subject.key === curr)) {
              return acc;
            }
            return acc.concat({ key: curr, text: curr, value: curr });
          }, [] as DropdownOption[])
      );
      setEegFilePaths(
        workspaceRawData.map((filepath) => ({
          key: filepath.name,
          text: filepath.name,
          value: filepath.path,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [props.title]);

  useEffect(() => {
    if (props.suggestedRejections.length > 0) {
      setRejectedEpochs((prev) => {
        const next = new Set(prev);
        for (const s of props.suggestedRejections) next.add(s.index);
        return next;
      });
    }
  }, [props.suggestedRejections]);

  function handleRecordingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const filePaths = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelectedFilePaths(filePaths);
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target;
    if (!isNil(value) && isString(value)) {
      setSelectedSubject(value);
      setSelectedFilePaths([]);
    }
  }

  function handleLoadData() {
    props.ExperimentActions.SetSubject(selectedSubject);
    props.PyodideActions.LoadEpochs(selectedFilePaths);
    setView('review');
    setRejectedEpochs(new Set());
    setBadChannels(new Set());
  }

  function handleToggleEpoch(index: number) {
    setRejectedEpochs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleToggleChannel(name: string) {
    const next = new Set(badChannels);
    const adding = !next.has(name);
    if (adding) {
      next.add(name);
    } else {
      next.delete(name);
    }
    setBadChannels(next);

    if (adding && next.size > 1 && props.epochArrays?.meta.n_channels === 4) {
      window.electronAPI.showMessageBox({
        buttons: ['Got it'],
        message:
          "You've marked more than one bad channel on a 4-channel recording. " +
          'That removes a big chunk of your data — if the signal is really this ' +
          'noisy, consider collecting another dataset.',
      });
    }
  }

  function handleAutoFlag() {
    props.PyodideActions.GetSuggestedRejections(autoFlagThreshold);
  }

  async function handleCleanData() {
    const total = props.epochArrays?.meta.n_epochs ?? 0;
    const nDropped = rejectedEpochs.size;
    if (total > 0 && nDropped >= total) {
      const response = await window.electronAPI.showMessageBox({
        buttons: ['Cancel', 'Reject all anyway'],
        message: `This will reject all ${total} epochs, leaving nothing to analyze. Are you sure?`,
      });
      if (response.response !== 1) {
        return;
      }
    }
    props.PyodideActions.CleanEpochs({ dropIndices: [...rejectedEpochs], badChannels: [...badChannels] });
    setRejectedEpochs(new Set());
    setBadChannels(new Set());
  }

  function handleThresholdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value);
    if (!Number.isNaN(parsed)) {
      setAutoFlagThreshold(parsed);
    }
  }

  function handleSidebarToggle() {
    setIsSidebarVisible((prev) => !prev);
  }

  function renderStats() {
    const { epochsInfo } = props;
    if (isNil(epochsInfo) || epochsInfo.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {epochsInfo.map((infoObj, index) => (
          <span key={String(infoObj.name)} className="whitespace-nowrap">
            <span className="mr-1">{icons[index]}</span>
            <span className="text-gray-500">{infoObj.name}:</span>{' '}
            <span className="font-medium">{infoObj.value}</span>
          </span>
        ))}
      </div>
    );
  }

  function renderAnalyzeButton() {
    const { epochsInfo } = props;
    if (!isNil(epochsInfo) && epochsInfo.length > 0) {
      return (
        <Link to="/analyze">
          <Button variant="default">Analyze Dataset</Button>
        </Link>
      );
    }
    return null;
  }

  function renderSelect(filteredFilePaths: DropdownOption[]) {
    return (
      <div className="max-w-2xl text-left">
        <h1>Clean</h1>
        <h4 className="mt-2">Select &amp; Clean</h4>
        <p>
          Ready to clean some data? Pick a subject and one or more EEG
          recordings, then launch the editor.
        </p>
        <h4 className="mt-4">Select Subject</h4>
        <select
          className="w-full border border-gray-300 rounded p-1 mb-2"
          value={selectedSubject}
          onChange={handleSubjectChange}
        >
          {subjects.map((s) => (
            <option key={s.key} value={s.value}>
              {s.text}
            </option>
          ))}
        </select>
        <h4>Select Recordings</h4>
        <select
          multiple
          className="w-full border border-gray-300 rounded p-1"
          value={selectedFilePaths}
          onChange={handleRecordingChange}
        >
          {filteredFilePaths.map((fp) => (
            <option key={fp.key} value={fp.value}>
              {fp.text}
            </option>
          ))}
        </select>
        <Button
          variant="default"
          className="mt-4 w-full"
          disabled={selectedFilePaths.length === 0}
          onClick={handleLoadData}
        >
          Load Dataset →
        </Button>
      </div>
    );
  }

  function renderReview(
    codeToLabel: Record<number, string>,
    suggestedRejections: SuggestedRejection[]
  ) {
    const hasEpochs = !isNil(props.epochArrays);
    const nRecordings = selectedFilePaths.length;
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => setView('select')}
          >
            ← Datasets
          </Button>
          <h1 className="m-0">Clean</h1>
          <span className="text-sm text-gray-500">
            {selectedSubject} · {nRecordings} recording
            {nRecordings === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            variant="default"
            disabled={isNil(props.epochsInfo)}
            onClick={handleCleanData}
          >
            Clean Data
          </Button>
          <Button
            variant="secondary"
            disabled={isNil(props.epochsInfo)}
            onClick={handleAutoFlag}
          >
            Auto-flag artifacts
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Auto-flag settings"
            onClick={() => setShowAutoFlagSettings((prev) => !prev)}
          >
            ⚙︎
          </Button>
          <div className="ml-auto">{renderAnalyzeButton()}</div>
        </div>

        {showAutoFlagSettings && (
          <div className="mb-3 text-left">
            <label
              className="text-sm font-medium block"
              htmlFor="autoflag-sensitivity"
            >
              Auto-flag threshold
            </label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">More flags</span>
              <input
                id="autoflag-sensitivity"
                type="range"
                min={PTP_THRESHOLD.min}
                max={PTP_THRESHOLD.max}
                step={PTP_THRESHOLD.step}
                value={autoFlagThreshold}
                aria-valuetext={`${autoFlagThreshold} µV peak-to-peak`}
                onChange={handleThresholdChange}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">Fewer flags</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Flag epochs whose peak-to-peak amplitude exceeds{' '}
              <span className="font-medium">
                {autoFlagThreshold} µV
              </span>
              .
            </p>
          </div>
        )}
        {suggestedRejections.length > 0 && (
          <div className="mb-3 text-left text-sm text-brand">
            <p className="font-medium">
              Flagged {suggestedRejections.length}{' '}
              {suggestedRejections.length === 1 ? 'epoch' : 'epochs'}
            </p>
            <ul className="text-xs text-gray-600 list-disc list-inside">
              {suggestedRejections.slice(0, 3).map((s, i) => (
                <li key={`${s.index}-${i}`}>{s.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">{renderStats()}</div>

        {hasEpochs ? (
          <div className="flex flex-wrap gap-6">
            <EpochReviewer
              epochArrays={props.epochArrays}
              rejected={rejectedEpochs}
              onToggleEpoch={handleToggleEpoch}
              badChannels={badChannels}
              onToggleChannel={handleToggleChannel}
              codeToLabel={codeToLabel}
            />
            <LiveErpPane
              epochArrays={props.epochArrays}
              rejected={rejectedEpochs}
              codeToLabel={codeToLabel}
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white/50 text-brand">
            Loading your epochs… 🧠
          </div>
        )}
      </>
    );
  }

  const filteredFilePaths = eegFilePaths.filter((filepath) => {
    const strVal = filepath.value;
    const subjectFromFilepath = strVal.split(path.sep)[
      strVal.split(path.sep).length - 3
    ];
    return selectedSubject === subjectFromFilepath;
  });

  const codeToLabel = codeToLabelFor(props.params?.stimuli);
  const { suggestedRejections } = props;

  return (
    <div className="relative flex h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      {isSidebarVisible && (
        <div className="absolute right-0 top-0 h-full w-64 z-10">
          <CleanSidebar handleClose={handleSidebarToggle} />
        </div>
      )}
      <div className="flex-1 p-[3%] overflow-y-auto">
        {view === 'select'
          ? renderSelect(filteredFilePaths)
          : renderReview(codeToLabel, suggestedRejections)}
      </div>
    </div>
  );
}