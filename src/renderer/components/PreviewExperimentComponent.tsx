import React from 'react';
import { ExperimentRuntime } from './ExperimentRuntime';
import { getImages } from '../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../constants/interfaces';
import { EXPERIMENTS } from '../constants/constants';

interface Props {
  title: string;
  type: EXPERIMENTS;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
  isPreviewing: boolean;
  onEnd: () => void;
}

function insertPreviewMarkerCallback(code: number, time: number) {
  console.log('EEG marker', code, time);
}

export default function PreviewExperimentComponent(props: Props) {
  function handleImages() {
    return getImages(props.params);
  }

  if (!props.isPreviewing) {
    return (
      <div className="grid items-center justify-center h-full">
        <div className="p-2">The experiment will be shown in the window</div>
      </div>
    );
  }
  return (
    <div className="h-full w-full flex">
      <ExperimentRuntime
        type={props.type}
        title={props.title}
        experimentObject={props.experimentObject}
        params={props.params}
        eventCallback={insertPreviewMarkerCallback}
        fullScreen={false}
        onFinish={props.onEnd}
      />
    </div>
  );
}
