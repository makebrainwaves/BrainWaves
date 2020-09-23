import React, { useEffect } from 'react';
import path from 'path';
import clonedeep from 'lodash.clonedeep';
import * as lab from 'lab.js/dist/lab.dev';
import { ExperimentParameters } from '../constants/interfaces';

// TODO: Switch to using .json files to load lab.js studies
import visualsearch from '../assets/default_experiments/search/labjs_script';
import stroop from '../assets/default_experiments/stroop/labjs_script';
import multitasking from '../assets/default_experiments/multitasking/labjs_script';
import faceshouses from '../assets/default_experiments/faces_houses/labjs_script';
import custom from '../utils/labjs/scripts/custom';
import { EXPERIMENTS } from '../constants/constants';

export interface ExperimentWindowProps {
  title: string;
  type: EXPERIMENTS;
  studyObject: any;
  params: ExperimentParameters;
  fullScreen?: boolean;
  eventCallback: (value: any, time: number) => void;
  onFinish: (csv: any) => void;
}

export const ExperimentWindow: React.FC<ExperimentWindowProps> = ({
  title,
  type,
  studyObject,
  params,
  fullScreen = true,
  eventCallback,
  onFinish,
}) => {
  useEffect(() => {
    // TODO: move this study mutation into Redux
    let studyWithParams = studyObject;

    // TODO: Remove eventually when study updating has been brought into redux
    switch (type) {
      case 'Multi-tasking':
        multitasking.parameters = params;
        studyWithParams = lab.util.fromObject(clonedeep(multitasking), lab);
        break;
      case 'Visual Search':
        visualsearch.parameters = params;
        studyWithParams = lab.util.fromObject(clonedeep(visualsearch), lab);
        break;
      case 'Stroop Task':
        stroop.parameters = params;
        studyWithParams = lab.util.fromObject(clonedeep(stroop), lab);
        break;
      case 'Faces and Houses':
        faceshouses.parameters = params;
        studyWithParams = lab.util.fromObject(clonedeep(faceshouses), lab);
        break;
      case 'Custom':
      default:
        custom.parameters = params;
        studyWithParams = lab.util.fromObject(clonedeep(custom), lab);
        break;
    }

    if (type === 'Custom' || type === 'Faces and Houses') {
      studyWithParams.parameters.title = title;
      studyWithParams.files = params.stimuli
        .map((image) => ({
          [path.join(image.dir, image.filename)]: path.join(
            image.dir,
            image.filename
          ),
        }))
        .reduce((obj, item) => ({ ...obj, ...item }), {});
    }

    studyWithParams.on('end', () => {
      const csv = studyWithParams.options.datastore.exportCsv();
      studyWithParams = undefined;
      onFinish(csv);
    });
    studyWithParams.parameters.callbackForEEG = (e) => {
      eventCallback(e, new Date().getTime());
    };
    studyWithParams.options.events.keydown = async (e) => {
      if (e.code === 'Escape') {
        if (studyWithParams) {
          await studyWithParams.internals.controller.audioContext.close();
          studyWithParams.end();
        }
      }
    };

    studyWithParams.run();

    return () => {
      try {
        if (studyWithParams) {
          studyWithParams.internals.controller.audioContext.close();
          studyWithParams.end();
        }
      } catch (e) {
        console.log('Experiment closed before unmount');
      }
    };
  }, []);

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
