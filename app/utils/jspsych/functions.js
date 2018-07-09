import { EXPERIMENTS } from "../../constants/constants";
import { buildOddballTimeline } from "./timelines/oddball";
import { buildN170Timeline } from "./timelines/n170";
import { buildSSVEPTimeline } from "./timelines/ssvep";

// loads a normalized timeline for the default experiments with specific callback fns
export const loadTimeline = (type, callback = console.log) => {
  let timeline;
  switch (type) {
    case EXPERIMENTS.P300:
      timeline = buildOddballTimeline(callback);
      break;

    case EXPERIMENTS.N170:
      timeline = buildN170Timeline(callback);
      break;

    case EXPERIMENTS.SSVEP:
      timeline = buildSSVEPTimeline(callback);
      break;

    default:
      timeline = buildOddballTimeline(callback);
      break;
  }
  return timeline;
};

// Converts a normalized timeline template into a classic jsPsych timeline array
export const parseTimeline = (mainTimeline, trials, timelines) => {
  // Combine trials and timelines into one object
  const jsPsychObject = { ...trials, ...timelines };
  // Map through the mainTimeline, returning the appropriate trial or timeline based on id
  return mainTimeline.map(id => jsPsychObject[id]);
};
