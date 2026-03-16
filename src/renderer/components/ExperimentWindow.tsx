import React, { useEffect } from 'react';
import path from 'pathe';
import { cloneDeep as clonedeep } from 'lodash';
import * as lab from 'lab.js';
import {
  ExperimentObject,
  ExperimentParameters,
  Stimulus,
} from '../constants/interfaces';

export interface ExperimentWindowProps {
  title: string;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
  fullScreen?: boolean;
  eventCallback: (value: string, time: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish: (csv: any) => void; // lab.js finish event data — shape is opaque third-party type
}

// Converts an absolute filesystem path to a URL the renderer can load.
// In Vite dev mode, /@fs/<path> serves files outside publicDir.
// In production the renderer has a file:// origin so file:// URLs work directly.
function absPathToUrl(absPath: string): string {
  return import.meta.env.DEV ? `/@fs${absPath}` : `file://${absPath}`;
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
            return [...images, absPathToUrl(path.join(stimulus.dir, stimulus.filename))];
          }
          return images;
        },
        []
      );
    }

    experimentToRun.on('end', () => {
      const csv = experimentToRun.options.datastore.exportCsv();
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
