/*
 * This file contains many of the TypeScript interfaces that are used across the project
 */

import { ChildProcess } from 'child_process';
import { EVENTS, SIGNAL_QUALITY } from './constants';

// TODO: Write interfaces for device objects (Observables, Classes, etc)

// All mutable aspects of an experiment that can be updated by the DesignComponent
export type ExperimentParameters = {
  trialDuration: number;
  nbTrials: number;
  iti: number;
  jitter: number;
  sampleType: string;
  intro: string;
  // Setting this to any prevents ridiculous flow runtime errors
  showProgessBar: any;
  stimuli: any[];
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
  stimulus3?: {
    dir: string;
    type: typeof EVENTS;
    title: string;
    response: string;
  };
  stimulus4?: {
    dir: string;
    type: typeof EVENTS;
    title: string;
    response: string;
  };
  nbPracticeTrials?: number;
  randomize?: 'random' | 'sequential';
  selfPaced?: boolean;
  presentationTime?: number;
  taskHelp?: string;
};

export type ExperimentDescription = {
  question: string;
  hypothesis: string;
  methods: string;
};

export interface ExperimentSettings {
  title: string;
  script: any;
  params: ExperimentParameters;
  eventCallback: (e: Event, time: number) => void;
  on_finish: (csv: any) => void;
}

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
  timeline_variables?: Array<Record<string, any>>;
};

export interface SampleParameter {
  type: string;
  size?: number;
  fn?: () => Array<number>;
}

export type StimulusVariable = () => any;

export interface StimuliDesc {
  dir: any;
  filename: string;
  name: string;
  condition: any;
  response: any;
  phase: string;
  type: number;
}

// --------------------------------------------------------------------
// Jupyter

export interface Kernel {
  config: Record<string, any>;
  connectionFile: string;
  kernelSpec: Record<string, any>;
  spawn: ChildProcess;
}

// --------------------------------------------------------------------
// Device

// TODO: type this based on what comes out of muse and emotiv
export interface Device {
  [key: string]: any;
}

export interface EEGData {
  data: Array<number>;
  timestamp: number;
  marker?: string | number;
}

export interface SignalQualityData {
  epoch: number[][];
  signalQuality: SIGNAL_QUALITY;
  timestamp?: number;
}

export interface DeviceInfo {
  name: string;
  samplingRate: number;
}

export interface PipesEpoch {
  data: number[][];
  signalQuality: { [channelName: string]: number };
  info: {
    samplingRate: number;
    startTime: number;
    channelNames?: string[];
  };
}

// --------------------------------------------------------------------
// General

export interface ActionType {
  readonly payload: any;
  readonly type: string;
}
