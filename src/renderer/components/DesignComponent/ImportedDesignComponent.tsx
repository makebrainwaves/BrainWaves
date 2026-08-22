/**
 * Design screen for an imported study.
 *
 * The Markers tab is the whole reason importing works. jsPsych has no condition
 * concept: `data` is a free-form bag, and `trial_type` holds the PLUGIN name, so
 * Face and House trials both rendered by image-keyboard-response are identical
 * there. There is no jsPsych-side string to pair against automatically — only
 * the key one author happened to pick.
 *
 * Codes are frozen HERE, before the first subject, and never interned on
 * encounter order: a code that meant Face for subject A and House for subject B
 * corrupts a cross-subject ERP average with no error anywhere.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { SCREENS, FILE_TYPES } from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { DesignProps } from './index';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { readImportedExperimentFile } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { scanTimelineSource } from '../../utils/jspsych/scan';
import { JSPSYCH_PLUGIN_GLOBALS } from '../../utils/jspsych/plugins';

const IMPORTED_STEPS = {
  OVERVIEW: 'OVERVIEW',
  MARKERS: 'MARKERS',
  PREVIEW: 'PREVIEW',
};

const SHIPPED_PLUGIN_GLOBALS = Object.keys(JSPSYCH_PLUGIN_GLOBALS);

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function ImportedDesign(props: DesignProps) {
  const imported = props.params.imported;
  const [activeStep, setActiveStep] = useState(IMPORTED_STEPS.OVERVIEW);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [conditionKey, setConditionKey] = useState(imported?.conditionKey ?? '');
  const [correctKey, setCorrectKey] = useState(imported?.correctKey ?? '');
  const [labels, setLabels] = useState<string[]>(
    imported?.conditionLabels ?? []
  );
  const [assetDir, setAssetDir] = useState(imported?.assetDir ?? '');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (!imported?.file) return undefined;
    let cancelled = false;
    readImportedExperimentFile(props.title, imported.file)
      .then((text) => {
        if (!cancelled) setSource(text);
      })
      .catch((failure: Error) => {
        if (!cancelled) setReadError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [imported?.file, props.title]);

  const scan = useMemo(
    () =>
      source ? scanTimelineSource(source, SHIPPED_PLUGIN_GLOBALS) : null,
    [source]
  );

  const dataKeys = useMemo(
    () => (scan ? Object.keys(scan.dataKeys).sort() : []),
    [scan]
  );

  // No declared conditions means no EEG markers, so an EEG recording would be a
  // technically-valid file of nothing. Behavior-only is an honest, already
  // first-class mode; force it rather than pretend. Guarded on the current value
  // so this settles instead of dispatching on every render.
  useEffect(() => {
    if (labels.length === 0 && props.isEEGEnabled) {
      props.ExperimentActions.SetEEGEnabled(false);
    }
  }, [labels.length, props.isEEGEnabled, props.ExperimentActions]);

  function handleConditionKeyChange(key: string) {
    setConditionKey(key);
    // Pre-populate from the static scan; the teacher confirms or edits.
    setLabels(scan?.dataKeys[key] ?? []);
  }

  function handleAddLabel() {
    const label = newLabel.trim();
    if (!label || labels.includes(label)) return;
    setLabels([...labels, label]);
    setNewLabel('');
  }

  async function handleSelectAssetFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.STIMULUS_DIR);
    if (dir) setAssetDir(dir);
  }

  function handleFreeze() {
    if (!imported) return;
    const nextParams: ExperimentParameters = {
      ...props.params,
      imported: {
        ...imported,
        conditionKey,
        correctKey,
        conditionLabels: labels,
        ...(assetDir ? { assetDir } : {}),
      },
    };
    props.ExperimentActions.SetParams(nextParams);
    props.ExperimentActions.SaveWorkspace();
  }

  function renderLabelEditor() {
    return (
      <div className="space-y-2">
        <span className="font-semibold">Conditions, in code order</span>
        <p className="text-gray-600">
          The order is the contract: it decides which number is written to the
          EEG Marker column, and it must not change once you have recorded a
          subject. The scan only sees branches spelled out in the file, so add
          anything it missed.
        </p>
        {labels.length === 0 ? (
          <p>No conditions yet.</p>
        ) : (
          <ul className="space-y-1">
            {labels.map((label, index) => (
              <li
                key={label}
                className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-2 items-center border border-gray-300 rounded px-2 py-1"
              >
                <span data-testid={`code-${label}`} className="font-mono">
                  {index + 1}
                </span>
                <span>{label}</span>
                <button
                  aria-label={`Move ${label} up`}
                  onClick={() => setLabels(move(labels, index, index - 1))}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${label} down`}
                  onClick={() => setLabels(move(labels, index, index + 1))}
                >
                  ↓
                </button>
                <button
                  aria-label={`Remove ${label}`}
                  onClick={() =>
                    setLabels(labels.filter((_, i) => i !== index))
                  }
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <label htmlFor="new-label">Add a label the scan missed</label>
            <input
              id="new-label"
              className="border border-gray-300 rounded px-2 py-1 w-full"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={handleAddLabel}>
            Add label
          </Button>
        </div>
      </div>
    );
  }

  function renderMarkers() {
    if (readError) {
      return (
        <div role="alert" className="p-4">
          <h2>This experiment could not be read</h2>
          <p className="text-gray-600">{readError}</p>
        </div>
      );
    }
    if (!scan) return <p className="p-4">Reading the study file…</p>;

    return (
      <div className="p-4 space-y-6 max-w-3xl overflow-y-auto h-[85%]">
        {labels.length === 0 && (
          <div className="border-2 border-gray-300 rounded p-3">
            Until you name at least one condition, this experiment records
            responses but no brain data. EEG is switched off.
          </div>
        )}

        {imported?.kind === 'labjs' && (
          <div className="border-2 border-gray-300 rounded p-3">
            This is an imported lab.js study. BrainWaves records its responses
            through lab.js&apos;s own datastore, so the keys below do not apply.
            Markers only reach the EEG file if the study itself calls
            <code> parameters.callbackForEEG</code> — the hook BrainWaves wires
            into the experiments it authors. Otherwise this runs behavior-only.
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="condition-key" className="font-semibold">
            Condition key
          </label>
          <p className="text-gray-600">
            jsPsych has no condition concept — pick the <code>data</code> key
            this author used to label their trials.
          </p>
          <select
            id="condition-key"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={conditionKey}
            onChange={(event) => handleConditionKeyChange(event.target.value)}
          >
            <option value="">Choose a key</option>
            {dataKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="correct-key" className="font-semibold">
            Correctness key
          </label>
          <p className="text-gray-600">
            Reaction-time and accuracy plots only count correct trials. If this
            study does not record correctness, leave this as &ldquo;not measured&rdquo; and
            every trial is counted as correct so reaction times still plot.
          </p>
          <select
            id="correct-key"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={correctKey}
            onChange={(event) => setCorrectKey(event.target.value)}
          >
            <option value="">
              Not measured — count every trial as correct
            </option>
            {dataKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {renderLabelEditor()}

        <div className="space-y-1">
          <span className="font-semibold">Asset folder</span>
          <p className="text-gray-600">
            Only needed if the study points at images or sounds with relative
            paths like <code>stimuli/face1.png</code>.
          </p>
          {assetDir ? (
            <div className="inline-grid grid-cols-[1fr_auto] gap-2.5 border-2 border-gray-300 p-2 rounded items-center">
              <span>{assetDir}</span>
              <button
                onClick={() => setAssetDir('')}
                aria-label="Remove asset folder"
              >
                ✕
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleSelectAssetFolder}>
              Select asset folder
            </Button>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <Button onClick={handleFreeze}>Freeze marker codes</Button>
          <Button
            variant="secondary"
            onClick={() => props.navigate(SCREENS.COLLECT.route)}
          >
            Go to Collect
          </Button>
        </div>
      </div>
    );
  }

  function renderSectionContent() {
    switch (activeStep) {
      case IMPORTED_STEPS.MARKERS:
        return renderMarkers();
      case IMPORTED_STEPS.PREVIEW:
        return (
          <div className="flex items-center p-4 h-[90%]">
            <div className="w-3/4 h-full border border-brand rounded">
              <PreviewExperimentComponent
                title={props.title}
                params={props.params}
                experimentObject={props.experimentObject}
                isPreviewing={isPreviewing}
                onEnd={() => setIsPreviewing(false)}
                type={props.type}
              />
            </div>
            <div className="w-1/4 flex justify-center">
              <PreviewButton
                isPreviewing={isPreviewing}
                onClick={(event) => {
                  event.currentTarget.blur();
                  setIsPreviewing((previous) => !previous);
                }}
              />
            </div>
          </div>
        );
      case IMPORTED_STEPS.OVERVIEW:
      default:
        return (
          <div className="p-4 max-w-3xl space-y-3">
            <h1>{props.title}</h1>
            <p>
              This experiment was written outside BrainWaves. BrainWaves runs it
              and records the responses. Name its conditions on the Markers tab
              and it records EEG markers too.
            </p>
            <p className="text-gray-600">
              Study file: <code>{imported?.file}</code>
            </p>
          </div>
        );
    }
  }

  return (
    <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      <SecondaryNavComponent
        title="Imported Experiment"
        steps={IMPORTED_STEPS}
        activeStep={activeStep}
        onStepClick={setActiveStep}
        enableEEGToggle={
          <input
            type="checkbox"
            checked={props.isEEGEnabled}
            disabled={labels.length === 0}
            onChange={(event) => {
              props.ExperimentActions.SetEEGEnabled(event.target.checked);
              props.ExperimentActions.SaveWorkspace();
            }}
            className="scale-75"
          />
        }
      />
      {renderSectionContent()}
    </div>
  );
}
