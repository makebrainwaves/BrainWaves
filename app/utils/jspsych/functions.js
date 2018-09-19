import { isNil } from "lodash";
import { jsPsych } from "jspsych-react";
import * as path from "path";
import { readdirSync } from "fs";
import { EXPERIMENTS } from "../../constants/constants";
import { buildOddballTimeline } from "./timelines/oddball";
import { buildN170Timeline } from "./timelines/n170";
import { buildSSVEPTimeline } from "./timelines/ssvep";
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from "../../constants/interfaces";

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
  params: ExperimentParameters,
  mainTimeline: MainTimeline,
  trials: { [string]: Trial },
  timelines: {}
) => {
  const parsedTimelines = Object.assign(
    ...Object.entries(timelines).map(([id, timeline]) => ({
      [id]: {
        ...timeline,
        timeline: [
          {
            ...timeline.timeline[0],
            trial_duration: () => params.iti + Math.random() * params.jitter
          },
          {
            ...timeline.timeline[1],
            stimulus: jsPsych.timelineVariable("stimulusVar"),
            type: params.pluginName,
            trial_duration: params.trialDuration
          }
        ],
        sample: {
          type: params.sampleType,
          size: Math.round(
            params.experimentDuration /
              (params.trialDuration + params.iti + params.jitter / 2)
          )
        },
        timeline_variables: readdirSync(params.stimulus1.dir)
          .map(filename => ({
            stimulusVar: path.join(params.stimulus1.dir, filename),
            eventTypeVar: params.stimulus1.type
          }))
          .concat(
            readdirSync(params.stimulus2.dir).map(filename => ({
              stimulusVar: path.join(params.stimulus2.dir, filename),
              eventTypeVar: params.stimulus2.type
            }))
          )
      }
    }))
  );

  console.table(parsedTimelines);
  // Combine trials and timelines into one object
  const jsPsychObject = { ...trials, ...parsedTimelines };
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
