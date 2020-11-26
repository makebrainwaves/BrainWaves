/*
 * This file contains many of the TypeScript interfaces that are used across the project
 */

import { ChildProcess } from 'child_process';
import { EVENTS, EXPERIMENTS, SIGNAL_QUALITY } from './constants';

// --------------------------------------------------------------------
// Experiment

// Placeholder type until lab.js has types for experiment descriptions
export interface ExperimentObject {
  [key: string]: any;
}

export interface WorkSpaceInfo {
  title: string;
  type: EXPERIMENTS;
}

// All mutable aspects of an experiment that can be updated by the DesignComponent
export type ExperimentParameters = {
  trialDuration: number;
  nbTrials: number;
  iti: number;
  jitter: number;
  sampleType: string;
  intro: string;
  showProgressBar: boolean;
  stimuli: Stimulus[];
  nbPracticeTrials?: number;
  // 'random' | 'sequential';
  // TODO: consider refactoring to expose lab.js sample.mode
  randomize?: string;
  selfPaced?: boolean;
  presentationTime?: number;
  taskHelp?: string;
  description: ExperimentDescription;
};

export interface Stimulus {
  condition?: string;
  response?: string;
  phase?: string;
  type: EVENTS;
  dir: string;
  title: string;
  filename: string;
}

interface ExperimentDescription {
  question: string;
  hypothesis: string;
  methods: string;
}

// TODO: Deprecate these with .md files soon
interface OverviewText {
  title: string;
  overview: string;
  links: { address: string; name: string }[];
}
interface BackgroundText {
  links: {
    address: string;
    name: string;
  }[];
  first_column_statement: string;
  first_column_question: string;
  second_column_statement: string;
  second_column_question: string;
}
interface ProtocolText {
  title: string;
  protocol: string;
  condition_first_img: any;
  condition_first_title: string;
  condition_first: string;
  condition_second_img: any;
  condition_second_title: string;
  condition_second: string;
}

export interface Experiment {
  // png
  experimentObject: ExperimentObject;
  icon: any;
  params: ExperimentParameters;
  text: {
    background: BackgroundText;
    overview: OverviewText;
    protocol: ProtocolText;
  };
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

// TODO: Write interfaces for device objects (Observables, Classes, etc)

// For unconnected available devices
export interface Device {
  // Human readable
  name?: string;
  // Unique ID
  id: string;
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

// For connected devices
export interface DeviceInfo {
  name: string;
  samplingRate: number;
  channels: string[];
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
