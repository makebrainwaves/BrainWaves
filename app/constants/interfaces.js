/*
* This file contains all the custom types that we use for Flow type checking
*/

// TODO: Write interfaces for device objects (Observables, Classes, etc)

// ------------------------------------------------------------------
// jsPsych

// TODO: Write interface for jsPsych plugins

// Array of timeline and trial ids that will be presented in experiment
export type MainTimeline = Array<string>;

// jsPsych trial presented as part of an experiment
export interface Trial {
  id: string;
  type: string;
  stimulus: string | StimulusVariable;
  trial_duration?: number | (() => number);
  post_trial_gap?: number;
  on_load?: string => void | StimulusVariable;
  choices?: Array<string>;
}

// Timeline of jsPsych trials
export interface Timeline {
  id: string;
  timeline: Array<Trial>;
  sample?: SampleParameter;
  timeline_variables?: Array<Object>;
}

export interface SampleParameter {
  type: string;
  size?: number;
  fn?: () => Array<number>;
}

export type StimulusVariable = () => any;

// --------------------------------------------------------------------
// Jupyter

export interface Kernel {
  config: Object;
  connectionFile: string;
  kernelSpec: Object;
  spawn: ChildProcess;
}

// --------------------------------------------------------------------
// Device

export interface EEGData {
  data: Array<number>;
  timestamp: number;
  marker?: string | number;
}

// --------------------------------------------------------------------
// General

export interface ActionType {
  +payload: any;
  +type: string;
}
