import React, { useEffect } from 'react';
import path from 'pathe';
import { cloneDeep as clonedeep } from 'lodash';
import * as lab from 'lab.js';
import {
  ExperimentObject,
  ExperimentParameters,
  Stimulus,
} from '../constants/interfaces';
import { toStimulusFileUrl } from '../../shared/stimulusUrl';

export interface ExperimentWindowProps {
  title: string;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
  fullScreen?: boolean;
  eventCallback: (value: number, time: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish: (csv: any) => void; // lab.js finish event data — shape is opaque third-party type
}

export const ExperimentWindow: React.FC<ExperimentWindowProps> = ({
  title,
  experimentObject,
  params,
  fullScreen = true,
  eventCallback,
  onFinish,
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
      experimentToRun.options.media.images = params.stimuli?.reduce<string[]>(
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
    }

    experimentToRun.on('end', () => {
      // lab.js 23.x moved the datastore from `options.datastore` to
      // `global.datastore` (controller.global). The old path is undefined and
      // throws inside the end handler, aborting lab.js's end sequence.
      const csv = experimentToRun.global.datastore.exportCsv();
      onFinish(csv);
    });

    // TODO: more natural labjs-y way to do this?
    experimentToRun.parameters.callbackForEEG = (e) => {
      eventCallback(e, new Date().getTime());
    };

    experimentToRun.options.events.keydown = async (e) => {
      if (e.code === 'Escape') {
        if (experimentToRun) {
          await experimentToRun.internals.controller.audioContext.close();
          experimentToRun.end();
        }
      }
    };

    experimentToRun.run();

    return () => {
      try {
        if (experimentToRun) {
          experimentToRun.internals.controller.audioContext.close();
          experimentToRun.end();
        }
      } catch (e) {
        console.log('Experiment closed before unmount');
      }
    };
  }, [eventCallback, experimentObject, onFinish, params, title]);

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
