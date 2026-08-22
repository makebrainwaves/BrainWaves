/**
 * The only file in BrainWaves that third-party experiment code touches.
 *
 * SECURITY POSTURE, on the record: imported code shares a realm with
 * `window.electronAPI` — including deleteWorkspaceDir, writeCleanedEpochs, and
 * the LSL bridge — under a CSP that already permits 'unsafe-eval'. Keeping the
 * execution in one component makes that exposure AUDITABLE, not prevented. It is
 * a deliberate, informed v1 tradeoff (design doc §6). Because the seam is
 * ExperimentRuntimeProps and nothing else, a later move to a cross-origin iframe
 * or an out-of-process webview edits this file and no other.
 */
import React, { useEffect, useRef, useState } from 'react';
import 'jspsych/css/jspsych.css';
import { buildMarkerRegistryFromLabels } from '../utils/eeg/markerRegistry';
import { rewriteRelativeAssetUrls } from '../utils/jspsych/assets';
import { createJsPsychHost } from '../utils/jspsych/host';
import { ImportedExperiment } from '../constants/interfaces';
import { ExperimentRuntimeProps } from './ExperimentRuntime';

export type ImportedExperimentWindowProps = ExperimentRuntimeProps & {
  source: string;
  imported: ImportedExperiment;
};

// jsPsych resolves a string display_element with
// `document.querySelector('#' + id)` (JsPsych.ts:340-343), so the id must be a
// bare CSS identifier — React's useId returns colons and would throw there. A
// module counter keeps ids unique if a Preview and a Run ever mount at once.
let hostCounter = 0;

export const ImportedExperimentWindow: React.FC<
  ImportedExperimentWindowProps
> = ({ source, imported, fullScreen = true, eventCallback, onFinish }) => {
  const hostElementId = useRef(
    `brainwaves-jspsych-host-${(hostCounter += 1)}`
  ).current;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prepared = imported.assetDir
      ? rewriteRelativeAssetUrls(source, imported.assetDir)
      : source;
    try {
      const host = createJsPsychHost(prepared, {
        hostElementId,
        mapping: {
          conditionKey: imported.conditionKey,
          correctKey: imported.correctKey,
        },
        registry: buildMarkerRegistryFromLabels(imported.conditionLabels),
        eventCallback,
        onFinish,
      });
      return host.teardown;
    } catch (failure) {
      setError((failure as Error).message);
      return undefined;
    }
  }, [eventCallback, hostElementId, imported, onFinish, source]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center h-full w-full p-4 text-center"
      >
        <div>
          <h2>This experiment could not run</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${fullScreen ? 'h-screen' : 'h-full'}`}>
      <div id={hostElementId} className="w-full h-full" />
    </div>
  );
};
