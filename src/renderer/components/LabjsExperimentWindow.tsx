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
 * Normal end → `onFinish(csv)`; unmount before the end → lab.js `end()` →
 * `onAbort(partial csv)`. Escape is not handled here — see RunComponent's
 * hold-Escape.
 */
export const LabjsExperimentWindow: React.FC<LabjsExperimentWindowProps> = ({
  title,
  experimentObject,
  params,
  fullScreen = true,
  eventCallback,
  onFinish,
  onAbort,
  onProgress,
}) => {
  useEffect(() => {
    // experimentObject starts as {} in Redux initial state — bail out until a
    // real experiment is loaded, otherwise lab.core.deserialize crashes on
    // the missing `type` field.
    if (!experimentObject?.type) return;

    // TODO: move this study mutation into Redux?
    const experimentClone = clonedeep(experimentObject);
    const paramsClone = clonedeep(params);
    experimentClone.parameters = paramsClone;
    const experimentToRun = lab.core.deserialize(experimentClone, lab);

    experimentToRun.parameters.title = title;
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
    let aborting = false;
    const partialCsv = () => {
      try {
        return experimentToRun.global.datastore.exportCsv();
      } catch {
        return '';
      }
    };
    // lab.js 23.x moved the datastore from `options.datastore` to
    // `global.datastore`; the old path throws inside lab.js's end sequence.
    experimentToRun.on('end', () => {
      finished = true;
      if (aborting) onAbort?.(partialCsv());
      else onFinish(experimentToRun.global.datastore.exportCsv());
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
      try {
        experimentToRun.internals.controller.audioContext.close();
      } catch {
        // No controller before the study prepares; nothing to close.
      }
      if (finished) return;
      aborting = true;
      Promise.resolve()
        .then(() => experimentToRun.end())
        .catch(() => onAbort?.(''));
    };
  }, [
    eventCallback,
    experimentObject,
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
