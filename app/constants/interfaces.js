/*
 * This file contains all the custom types that we use for Flow type checking
 */

import { EVENTS } from './constants';

// TODO: Write interfaces for device objects (Observables, Classes, etc)

// ------------------------------------------------------------------
// jsPsych

// TODO: Write interface for jsPsych plugins

export type ExperimentParameters = {
  trialDuration: number,
  nbTrials: number,
  iti: number,
  jitter: number,
  sampleType: string,
  pluginName: string,
  intro: string,
  // Setting this to any prevents ridiculous flow runtime errors
  showProgessBar: any,
  stimulus1: { dir: string, type: EVENTS, title: string, response: string },
  stimulus2: { dir: string, type: EVENTS, title: string, response: string },
};

export type ExperimentDescription = {
  question: string,
  hypothesis: string,
  methods: string,
};

// Array of timeline and trial ids that will be presented in experiment
export type MainTimeline = Array<string>;

// jsPsych trial presented as part of an experiment
export interface Trial {
  id: string;
  type: string;
  stimulus?: string | StimulusVariable;
  trial_duration?: number | (() => number);
  post_trial_gap?: number;
  on_load?: (string) => void | StimulusVariable;
  choices?: Array<string>;
}

// Timeline of jsPsych trials
export type Timeline = {
  id: string,
  timeline: Array<Trial>,
  sample?: SampleParameter,
  timeline_variables?: Array<Object>,
};

export interface SampleParameter {
  type: string;
  size?: number;
  fn?: () => Array<number>;
}

export type StimulusVariable = () => any;

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
  +payload: any;
  +type: string;
}
