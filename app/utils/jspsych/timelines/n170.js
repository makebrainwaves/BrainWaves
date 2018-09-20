import { jsPsych } from "jspsych-react";
import * as path from "path";
import { readdirSync } from "fs";
import { EVENTS } from "../../../constants/constants";

// Default experiment parameters
const paramsFn = () => {
  const trial_duration = 300;
  const experiment_duration = 120000; // two minutes
  const iti = 800;
  const jitter = 200;
  const n_trials = Math.round(
    experiment_duration / (trial_duration + iti + jitter / 2)
  );
  const plugin_name = "callback-image-display";
  return {
    trial_duration,
    experiment_duration,
    iti,
    jitter,
    n_trials,
    plugin_name
  };
};

const params = paramsFn();

// Default directories containing stimuli
// Note: there's a weird issue where the fs readdir function reads from BrainWaves dir
// while the timeline reads from Brainwaves/app. Currently removing 'app/' from path in timeline
const rootFolder = __dirname;
const facesDir = path.join(rootFolder, "assets", "face_house", "faces");
const housesDir = path.join(rootFolder, "assets", "face_house", "houses");
const fixation = path.join(rootFolder, "assets", "face_house", "fixation.jpg");

export const buildN170Timeline = () => ({
  params: {
    trialDuration: 300,
    experimentDuration: 120000,
    iti: 800,
    jitter: 200,
    sampleType: "with-replacement",
    pluginName: "callback-image-display",
    stimulus1: { dir: facesDir, type: EVENTS.FACE },
    stimulus2: { dir: housesDir, type: EVENTS.HOUSE }
  },
  mainTimeline: ["welcome", "faceHouseTimeline", "end"], // array of trial and timeline ids
  trials: {
    welcome: {
      type: "callback-html-display",
      id: "welcome",
      stimulus: "Welcome to the experiment. Press any key to begin.",
      post_trial_gap: 1000
    },
    end: {
      id: "end",
      type: "callback-html-display",
      stimulus: "Thanks for participating",
      post_trial_gap: 500
    }
  },
  timelines: {
    faceHouseTimeline: {
      id: "faceHouseTimeline",
      timeline: [
        {
          id: "interTrial",
          type: "callback-image-display",
          stimulus: fixation
          // trial_duration: () => params.iti + Math.random() * params.jitter
        },
        {
          id: "trial",
          // stimulus: jsPsych.timelineVariable("stimulusVar"),
          // type: params.plugin_name,
          choices: ["f", "j"]
          // trial_duration: params.trial_duration
        }
      ],
      sample: {
        // type: "with-replacement",
        // size: params.n_trials
      }
      // timeline_variables: readdirSync(facesDir)
      //   .filter(filename => filename.includes("3"))
      //   .map(filename => ({
      //     stimulusVar: path.join(facesDir, filename),
      //     eventTypeVar: EVENTS.FACE
      //   }))
      //   .concat(
      //     readdirSync(housesDir)
      //       .filter(filename => filename.includes("3"))
      //       .map(filename => ({
      //         stimulusVar: path.join(housesDir, filename),
      //         eventTypeVar: EVENTS.HOUSE
      //       }))
      //   )
    }
  }
});
