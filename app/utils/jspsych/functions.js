import { isNil } from "lodash";
import { jsPsych } from "jspsych-react";

import { EXPERIMENTS } from "../../constants/constants";
import { buildOddballTimeline } from "./timelines/oddball";
import { buildN170Timeline } from "./timelines/n170";
import { buildSSVEPTimeline } from "./timelines/ssvep";
import { MainTimeline, Trial } from "../../constants/interfaces";

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
      timeline = buildN170Timeline();
      break;
  }
  return timeline;
};

// Converts a normalized timeline template into a classic jsPsych timeline array
export const parseTimeline = (
  mainTimeline: MainTimeline,
  trials: { [string]: Trial },
  timelines: {}
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
            on_start: () =>
              eventCallback(
                jsPsych.timelineVariable("eventTypeVar")(),
                new Date().getTime()
              ),
            on_finish: () => {
              jsPsych.setProgressBar(
                jsPsych.progress().current_trial_global /
                  2 /
                  jspsychObject.sample.size
              );
            }
          };
        }
        return trial;
      });
      return { ...jspsychObject, timeline: timelineWithCallback };
    }
    return jspsychObject;
  });

// TODO: Filter out intertrial trials
export const getBehaviouralData = () => {
  return jsPsych.data
    .get()
    .ignore("internal_node_id")
    .csv();
};

// Returns an array of images that are used in a timeline for use in preloading
export const getImages = (
  mainTimeline: MainTimeline,
  trials: { [string]: Trial },
  timelines: {}
) => {
  const images = [];
  Object.values(timelines).forEach(element => {
    if ("timeline" in element) {
      element["timeline"].forEach(trial => {
        if (isImagePath(trial["stimulus"])) {
          images.push(trial["stimulus"]);
        }
      });
    }
    if ("timeline_variables" in element) {
      element["timeline_variables"].forEach(timelineVariable => {
        if (isImagePath(timelineVariable["stimulusVar"])) {
          images.push(timelineVariable["stimulusVar"]);
        }
      });
    }
  });
  return images;
};

// ---------------------------------------------------------
// Helper Methods

const isImagePath = (unknown: any) => {
  if (typeof unknown === "string") {
    if (unknown.slice(-3) === "jpg") {
      return true;
    }
    if (unknown.slice(-3) === "png") {
      return true;
    }
  }
  return false;
};
