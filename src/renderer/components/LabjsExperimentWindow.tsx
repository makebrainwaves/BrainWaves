import React, { useEffect } from 'react';
import path from 'pathe';
import { cloneDeep as clonedeep } from 'lodash';
import * as lab from 'lab.js';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../constants/interfaces';
import { toStimulusFileUrl } from '../../shared/stimulusUrl';
import { ExperimentRuntimeProps } from './ExperimentRuntime';
import { progressFromStack } from '../utils/labjs/progress';

export type LabjsExperimentWindowProps = ExperimentRuntimeProps & {
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
};

/**
 * Normal end → `onFinish(csv)`. Unmount before the end → `onAbort` at once
 * with the trials committed so far, then the study is stopped with the
 * controller's `jump('abort')` (lab.js 23's own abort, as its debug plugin
 * uses). Escape is not handled here — see RunComponent's hold-Escape.
 */
export const LabjsExperimentWindow: React.FC<LabjsExperimentWindowProps> = ({
  title,
  experimentObject,
  params,
  fullScreen = true,
  isEEGEnabled,
  eventCallback,
  onFinish,
  onAbort,
  onProgress,
}) => {
  useEffect(() => {
    // experimentObject starts as {} and params as null in Redux initial state
    // (and again after ExperimentCleanup) — bail out until a real experiment is
    // loaded, otherwise lab.core.deserialize crashes on the missing `type`
    // field and lab.js's parameter proxy throws on null params.
    if (!experimentObject?.type || !params) return;

    // TODO: move this study mutation into Redux?
    const experimentClone = clonedeep(experimentObject);
    const paramsClone = clonedeep(params);
    experimentClone.parameters = paramsClone;
    const experimentToRun = lab.core.deserialize(experimentClone, lab);

    experimentToRun.parameters.title = title;
    experimentToRun.parameters.isEEGEnabled = Boolean(isEEGEnabled);
    if (params.stimuli) {
      experimentToRun.options.media.images = params.stimuli.reduce<string[]>(
        (images, stimulus) => {
          if (stimulus.dir && stimulus.filename) {
            return [
              ...images,
              toStimulusFileUrl(path.join(stimulus.dir, stimulus.filename)),
            ];
          }
          return images;
        },
        []
      );
      experimentToRun.options.media.audio = params.stimuli.reduce<string[]>(
        (audio, stimulus) => {
          if (stimulus.audioDir && stimulus.audioFilename) {
            return [
              ...audio,
              toStimulusFileUrl(
                path.join(stimulus.audioDir, stimulus.audioFilename)
              ),
            ];
          }
          return audio;
        },
        []
      );
    }

    let finished = false;
    // lab.js 23.x moved the datastore and audio context from `options`/the
    // controller to `global`; the old paths throw inside lab.js's end sequence.
    experimentToRun.on('end', () => {
      void experimentToRun.global.audioContext.close();
      if (finished) return;
      finished = true;
      onFinish(experimentToRun.global.datastore.exportCsv());
    });

    // TODO: more natural labjs-y way to do this?
    experimentToRun.parameters.callbackForEEG = (label: string) => {
      eventCallback(label, Date.now());
    };

    if (onProgress) {
      let last = '';
      // The controller exists once the root prepares, and emits one 'flip' per
      // screen change with the active root→leaf component stack.
      experimentToRun.on('prepare', () => {
        const { controller } = experimentToRun.internals;
        controller.on('flip', () => {
          const progress = progressFromStack(controller.currentStack);
          const key = JSON.stringify(progress);
          if (key !== last) {
            last = key;
            onProgress(progress);
          }
        });
      });
    }

    experimentToRun.run();

    return () => {
      if (finished) return;
      finished = true;
      let csv = '';
      try {
        csv = experimentToRun.global.datastore.exportCsv();
      } catch {
        // No controller before the study prepares; nothing was recorded.
      }
      onAbort?.(csv);
      // A bare root `end()` does not stop lab.js 23 (the flip loop keeps
      // iterating), and an abort between a screen's render and show frames
      // hangs it, so the abort waits two frames for pending flips to settle.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          Promise.resolve()
            .then(() =>
              experimentToRun.internals.controller.jump('abort', {
                sender: experimentToRun,
              })
            )
            .catch(() => undefined);
        })
      );
    };
  }, [
    eventCallback,
    experimentObject,
    isEEGEnabled,
    onAbort,
    onFinish,
    onProgress,
    params,
    title,
  ]);

  return (
    <div
      className={`container ${fullScreen && 'fullscreen'}`}
      data-labjs-section="main"
    >
      <main className="content-vertical-center content-horizontal-center">
        <div>
          <h2>Loading Experiment</h2>
          <p>The experiment is loading and should start in a few seconds</p>
        </div>
      </main>
    </div>
  );
};
