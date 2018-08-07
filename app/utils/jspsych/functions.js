import { isNil } from "lodash";
import { jsPsych } from "jspsych-react";

import { EXPERIMENTS } from "../../constants/constants";
import { buildOddballTimeline } from "./timelines/oddball";
import { buildN170Timeline } from "./timelines/n170";
import { buildSSVEPTimeline } from "./timelines/ssvep";
import { MainTimeline, Timeline, Trial } from "../../constants/interfaces";

// loads a normalized timeline for the default experiments with specific callback fns
export const loadTimeline = (type: EXPERIMENTS) => {
  let timeline;
  switch (type) {
    case EXPERIMENTS.P300:
      timeline = buildOddballTimeline();
      break;

    case EXPERIMENTS.N170:
      timeline = buildN170Timeline();
      break;

    case EXPERIMENTS.SSVEP:
      timeline = buildSSVEPTimeline();
      break;

    default:
      timeline = buildOddballTimeline();
      break;
  }
  return timeline;
};

// Converts a normalized timeline template into a classic jsPsych timeline array
export const parseTimeline = (
  mainTimeline: MainTimeline,
  trials: { [string]: Trial },
  timelines: { [string]: Timeline }
) => {
  // Combine trials and timelines into one object
  const jsPsychObject = { ...trials, ...timelines };
  // Map through the mainTimeline, returning the appropriate trial or timeline based on id
  return mainTimeline.map(id => jsPsychObject[id]);
};

// Fills in on_load functions in jsPsych timeline array with callback functions
// For events, looks for an existing eventType object in the trial to set a value for the eventCallback
export const instantiateTimeline = (
  timeline: Object,
  eventCallback: (?string) => void,
  startCallback: ?() => void = null,
  stopCallback: ?() => void = null
) =>
  timeline.map((jspsychObject, index) => {
    if (index === 0) {
      // start
      return { ...jspsychObject, on_finish: startCallback };
    }
    if (index === timeline.length - 1) {
      // stop
      return { ...jspsychObject, on_load: stopCallback };
    }
    if (!isNil(jspsychObject.timeline)) {
      const timelineWithCallback = jspsychObject.timeline.map(trial => {
        if (trial.id === "trial") {
          return {
            ...trial,
            on_load: () =>
              eventCallback(
                jsPsych.timelineVariable("eventTypeVar")(),
                new Date().getTime()
              )
          };
        }
        return trial;
      });
      return { ...jspsychObject, timeline: timelineWithCallback };
    }
    return jspsychObject;
  });
