// This file contains all the custom types that we use for Flow type checking

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

export interface ActionType {
  +payload: any;
  +type: string;
}
