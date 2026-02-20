import React, { useEffect } from 'react';
import path from 'pathe';
import { cloneDeep as clonedeep } from 'lodash';
import * as lab from 'lab.js/dist/lab.dev';
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
  onFinish: (csv: any) => void;
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
    // TODO: move this study mutation into Redux?
    const experimentClone = clonedeep(experimentObject);
    const paramsClone = clonedeep(params);
    experimentClone.parameters = paramsClone;
    const experimentToRun = lab.util.fromObject(experimentClone, lab);

    experimentToRun.parameters.title = title;
    if (params.stimuli) {
      experimentToRun.options.media.images = params.stimuli?.reduce<string[]>(
        (images, stimulus) => {
          if (stimulus.dir && stimulus.filename) {
            return [...images, path.join(stimulus.dir, stimulus.filename)];
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
