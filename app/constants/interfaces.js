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
  stimulus: string;
  +post_trial_gap: number;
  +on_load: () => string => void;
}

// Timeline of jsPsych trials
export interface Timeline {
  id: string;
  timeline: Array<Trial>;
  +sample: Object<string, Function>;
  +timeline_variables: Object<Object>;
}

// --------------------------------------------------------------------
// Jupyter

export interface Kernel {
  config: Object;
  connectionFile: string;
  kernelSpec: Object;
  spawn: ChildProcess;
}

// --------------------------------------------------------------------
// General

export interface ActionType {
  +payload: any;
  +type: string;
}
