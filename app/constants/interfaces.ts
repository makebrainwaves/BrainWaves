/*
 * This file contains all the custom types that we use for Flow type checking
 */

import { ChildProcess } from 'child_process';
import { EVENTS } from './constants';

// TODO: Write interfaces for device objects (Observables, Classes, etc)

// ------------------------------------------------------------------
// lab.js Experiment

export type ExperimentParameters = {
  trialDuration: number;
  nbTrials: number;
  iti: number;
  jitter: number;
  sampleType: string;
  intro: string;
  // Setting this to any prevents ridiculous flow runtime errors
  showProgessBar: any;
  stimulus1: {
    dir: string;
    type: typeof EVENTS;
    title: string;
    response: string;
  };
  stimulus2: {
    dir: string;
    type: typeof EVENTS;
    title: string;
    response: string;
  };
};

export type ExperimentDescription = {
  question: string;
  hypothesis: string;
  methods: string;
};

// Array of timeline and trial ids that will be presented in experiment
export type MainTimeline = Array<string>;

// jsPsych trial presented as part of an experiment
export interface Trial {
  id: string;
  type: string;
  stimulus?: string | StimulusVariable;
  trial_duration?: (() => number) | number;
  post_trial_gap?: number;
  on_load?: (arg0: string) => void | StimulusVariable;
  choices?: Array<string>;
}

// Timeline of jsPsych trials
export type Timeline = {
  id: string;
  timeline: Array<Trial>;
  sample?: SampleParameter;
  timeline_variables?: Array<object>;
};

export interface SampleParameter {
  type: string;
  size?: number;
  fn?: () => Array<number>;
}

export type StimulusVariable = () => any;

// --------------------------------------------------------------------
// Jupyter

export interface Kernel {
  config: object;
  connectionFile: string;
  kernelSpec: object;
  spawn: ChildProcess;
}

// --------------------------------------------------------------------
// Device

export interface EEGData {
  data: Array<number>;
  timestamp: number;
  marker?: string | number;
}

export interface DeviceInfo {
  name: string;
  samplingRate: number;
}

// --------------------------------------------------------------------
// General

export interface ActionType {
  readonly payload: any;
  readonly type: string;
}
