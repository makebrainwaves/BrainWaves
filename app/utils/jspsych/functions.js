import { isNil } from 'lodash';
import { jsPsych } from 'jspsych-react';
import * as path from 'path';
import { readdirSync } from 'fs';
import lsl from 'node-lsl';
import { EXPERIMENTS } from '../../constants/constants';
import { buildOddballTimeline } from './timelines/oddball';
import { buildN170Timeline } from './timelines/n170';
import { buildSSVEPTimeline } from './timelines/ssvep';
import { buildStroopTimeline } from './timelines/stroop';
import { buildMultiTimeline } from './timelines/multi';
import { buildSearchTimeline } from './timelines/search';
import { buildCustomLine } from './timelines/custom';

import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';

// create and open an outlet to stream data
const info = lsl.create_streaminfo(
  'jsPsych',
  'Marker', // type
  1, // number of channels
  0, // irregular sample rate
  lsl.channel_format_t.cft_float32,
  'jspsych_brainwaves' // source_id
);
const desc = lsl.get_desc(info);
lsl.append_child_value(desc, 'manufacturer', 'BrainWaves');
const channels = lsl.append_child(desc, 'channels');
const channel = lsl.append_child(channels, 'channel');
lsl.append_child_value(channel, 'type', 'Marker');
const outlet = lsl.create_outlet(info, 0, 360);

// loads a normalized timeline for the default experiments with specific callback fns
export const loadTimeline = (paradigm: EXPERIMENTS) => {
  console.log('paradigm', paradigm)
  let timeline;
  switch (paradigm) {
    case EXPERIMENTS.P300:
      timeline = buildOddballTimeline();
      break;

    case EXPERIMENTS.N170:
      timeline = buildN170Timeline();
      break;

    case EXPERIMENTS.SSVEP:
      timeline = buildSSVEPTimeline();
      break;

    case EXPERIMENTS.STROOP:
      timeline = buildStroopTimeline();
      break;

    case EXPERIMENTS.MULTI:
      timeline = buildMultiTimeline();
      break;

    case EXPERIMENTS.SEARCH:
      timeline = buildSearchTimeline();
      break;

    case EXPERIMENTS.CUSTOM:
      timeline = buildN170Timeline();
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
            stimulus: jsPsych.timelineVariable('stimulusVar'),
            type: params.pluginName,
            trial_duration: params.trialDuration,
            choices: [params.stimulus1.response, params.stimulus2.response],
            event_title: jsPsych.timelineVariable('eventTitleVar'),
            correct_response: jsPsych.timelineVariable('responseVar')
          }
        ],
        sample: {
          type: params.sampleType,
          size: params.nbTrials
        },
        timeline_variables: readdirSync(params.stimulus1.dir)
          .map(filename => ({
            stimulusVar: path.join(params.stimulus1.dir, filename),
            eventTypeVar: params.stimulus1.type,
            eventTitleVar: params.stimulus1.title,
            responseVar: params.stimulus1.response
          }))
          .concat(
            readdirSync(params.stimulus2.dir).map(filename => ({
              stimulusVar: path.join(params.stimulus2.dir, filename),
              eventTypeVar: params.stimulus2.type,
              eventTitleVar: params.stimulus2.title,
              responseVar: params.stimulus2.response
            }))
          )
      }
    }))
  );

  // Inserts param.intro as stimulus property of first trial
  const parsedTrials = Object.assign(
    ...Object.entries(trials).map(([id, trial]) => {
      if (id === mainTimeline[0]) {
        return { [id]: { ...trial, stimulus: params.intro } };
      }
      return { [id]: trial };
    })
  );

  // Combine trials and timelines into one object
  const jsPsychObject = { ...parsedTrials, ...parsedTimelines };
  // Map through the mainTimeline, returning the appropriate trial or timeline based on id
  return mainTimeline.map(id => jsPsychObject[id]);
};

// Fills in on_load functions in jsPsych timeline array with callback functions
// For events, looks for an existing eventType object in the trial to set a value for the eventCallback
export const instantiateTimeline = (
  timeline: Object,
  eventCallback: (?string) => void,
  startCallback: ?() => void = null,
  stopCallback: ?() => void = null,
  showProgessBar: ?boolean = false
) =>
  timeline.map((jspsychObject, index) => {
    if (index === 0) {
      // intro
      return { ...jspsychObject, on_finish: startCallback };
    }
    if (index === timeline.length - 1) {
      // end
      return { ...jspsychObject, on_load: stopCallback };
    }
    if (!isNil(jspsychObject.timeline)) {
      const timelineWithCallback = jspsychObject.timeline.map(trial => {
        if (trial.id === 'trial') {
          return {
            ...trial,
            on_start: () => {
              const eventType = jsPsych.timelineVariable('eventTypeVar')() || 0;
              lsl.push_sample_ft(
                outlet,
                new lsl.FloatArray([eventType]),
                lsl.local_clock()
              );
              eventCallback(
                jsPsych.timelineVariable('eventTypeVar')(),
                new Date().getTime()
              );
            },
            on_finish: (data: any) => {
              data.key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(
                data.key_press
              );
              data.expected_key_press = trial.correct_response();
              data.event_title = trial.event_title();
              if (data.key_press === data.expected_key_press) {
                data.correct = true;
              } else {
                data.correct = false;
              }
              if (showProgessBar) {
                jsPsych.setProgressBar(
                  jsPsych.progress().current_trial_global /
                    2 /
                    jspsychObject.sample.size
                );
              }
            }
          };
        }
        return trial;
      });
      return { ...jspsychObject, timeline: timelineWithCallback };
    }
    return jspsychObject;
  });

// Gets the last set of behavioral (key press) data stored in jsPsych
export const getBehaviouralData = () => {
  const rawData = jsPsych.data.get().values();

  // Mutate rawData array to customize behavioural results output
  for (let index = 0; index < rawData.length; index++) {
    rawData[index] = {
      ...rawData[index],
      reaction_time: rawData[index].rt, // rename rt to reaction_time
      trial_index: rawData[index].trial_index / 2 // Remove fixations from trial index
    };
  }
  rawData.shift(); // Remove first 'welcome' trial
  rawData.pop(); // Remove last 'thanks for participating' trial

  return jsPsych.data
    .get()
    .filterCustom(trial => !trial.stimulus.includes('fixation')) // Remove inter trial data
    .ignore('rt')
    .ignore('internal_node_id')
    .ignore('trial_type')
    .csv();
};

// Returns an array of images that are used in a timeline for use in preloading
export const getImages = (params: ExperimentParameters) =>
  readdirSync(params.stimulus1.dir)
    .map(filename => path.join(params.stimulus1.dir, filename))
    .concat(
      readdirSync(params.stimulus2.dir).map(filename =>
        path.join(params.stimulus2.dir, filename)
      )
    );
