/*
 * This file contains many of the TypeScript interfaces that are used across the project
 */

import { ChildProcess } from 'child_process';
import { EVENTS, EXPERIMENTS, SIGNAL_QUALITY } from './constants';

// --------------------------------------------------------------------
// Experiment

// Placeholder type until lab.js has types for experiment descriptions
export interface ExperimentObject {
  [key: string]: unknown;
}

export type ImportedExperimentKind = 'jspsych' | 'labjs';

/**
 * Everything BrainWaves needs in order to run an externally-authored study.
 *
 * `conditionLabels` is ORDERED and the order is the contract: the label at
 * index i carries marker code i + 1. It is frozen in the Markers tab before the
 * first subject runs, because interning labels on encounter order would give
 * subject A `Face=1` and subject B `Face=2` under different randomization —
 * silently corrupting cross-subject ERP averaging. Editing a later label can
 * never renumber an earlier one.
 *
 * An empty `conditionLabels` is a legitimate, first-class state: the study runs
 * behavior-only and EEG is forced off.
 */
export interface ImportedExperiment {
  kind: ImportedExperimentKind;
  /** POSIX path of the copied study file, relative to the workspace directory. */
  file: string;
  /** Author `data` key holding the condition label; '' until chosen. */
  conditionKey: string;
  /** Author `data` key holding trial correctness; '' means "not measured". */
  correctKey: string;
  /** Condition labels in code order. */
  conditionLabels: string[];
  /**
   * Absolute path of the folder the author's relative asset URLs resolve
   * against. Authorized through the same StimulusFileAccess allowlist as
   * custom-experiment stimulus folders.
   */
  assetDir?: string;
}

export interface WorkSpaceInfo {
  title: string;
  type: EXPERIMENTS;
  /** Set only when the workspace is created from an imported study. */
  imported?: ImportedExperiment;
}

// All mutable aspects of an experiment that can be updated by the DesignComponent
export type StimulusCondition = {
  dir?: string;
  // Optional folder of sounds (.mp3/.wav/...) played at trial onset.
  // A condition can be visual (dir), auditory (audioDir), or both.
  audioDir?: string;
  title: string;
  type: EVENTS;
  response: string;
};

export type ExperimentParameters = {
  // TODO: consider refactoring to expose lab.js sample.mode
  description?: ExperimentDescription;
  intro: string;
  iti: number;
  nbPracticeTrials?: number;
  nbTrials: number;
  presentationTime?: number;
  randomize?: 'random' | 'sequential';
  sampleType: string;
  selfPaced?: boolean;
  showProgressBar: boolean;
  stimuli?: Stimulus[];
  taskHelp?: string;
  trialDuration: number;
  imageHeight?: string;
  // Custom-experiment condition folders (2020 builder). Absent on built-ins.
  stimulus1?: StimulusCondition;
  stimulus2?: StimulusCondition;
  stimulus3?: StimulusCondition;
  stimulus4?: StimulusCondition;
  // Set only for EXPERIMENTS.IMPORTED: the externally-authored study and the
  // condition contract the Markers tab froze for it.
  imported?: ImportedExperiment;
};

export interface Stimulus {
  condition?: string;
  response?: string;
  phase?: string;
  type: EVENTS;
  dir?: string;
  title: string;
  filename?: string;
  // Sound played at trial onset. A trial can carry an image, a sound, or both.
  audioDir?: string;
  audioFilename?: string;
}

export interface ExperimentDescription {
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
  condition_first_img: string; // image URL from Vite import
  condition_first_title: string;
  condition_first: string;
  condition_second_img: string; // image URL from Vite import
  condition_second_title: string;
  condition_second: string;
}

export interface Experiment {
  // png
  experimentObject: ExperimentObject;
  icon: string; // image URL from Vite import
  params: ExperimentParameters;
  text: {
    background: BackgroundText;
    overview: OverviewText;
    protocol: ProtocolText;
  };
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
  info: {
    samplingRate: number;
    startTime: number;
    channelNames?: string[];
    // @neurosity/pipes >=5 nests the raw per-channel signal-quality (stddev)
    // values produced by addSignalQuality() under `info`, not at the top level.
    signalQuality: { [channelName: string]: number };
  };
}

// --------------------------------------------------------------------
// General

export interface ActionType {
  readonly payload: unknown;
  readonly type: string;
}
