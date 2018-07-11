import { jsPsych } from "jspsych-react";
import { readdirSync } from "fs";

// Default experiment parameters
const params = {
  trial_duration: 300,
  stim_duration: 300,
  iti: 300,
  jitter: 200,
  n_trials: 170, // Around two minutes at a rate of ~700 ms per trial
  prob: 0.15,
  plugin_name: "callback_image_display"
};

//  Default directories containing stimuli
// Note: there's a weird issue where the fs readdir function reads from BrainWaves dir
// while the timeline reads from Brainwaves/app. Currently removing 'app/' from path in timeline
const targetsDir = "./app/assets/cat_dog/cats/";
const nontargetsDir = "./app/assets/cat_dog/dogs/";

// Oddball sampling function
// Assumes first half of the trials are oddball stimuli
// TODO: Make this autogenerate from reading dir
const oddballSamplingFn = trials => {
  const trialOrder = new Array(params.n_trials).fill(0).map(() => {
    if (Math.random() > params.prob) {
      return Math.floor(
        Math.random() * (trials.length - trials.length / 2) + trials.length / 2
      );
    }
    return Math.floor(Math.random() * (trials.length / 2));
  });
  return trialOrder;
};

export const buildOddballTimeline = callback => ({
  mainTimeline: ["welcome", "oddballTimeline", "end"], // array of trial and timeline ids
  trials: {
    welcome: {
      type: "callback_html_display",
      id: "welcome",
      stimulus: "Welcome to the experiment. Press any key to begin.",
      post_trial_gap: 1000,
      on_load: () => callback("start")
    },
    end: {
      id: "end",
      type: "callback_html_display",
      stimulus: "Thanks for participating",
      post_trial_gap: 500,
      on_load: callback("stop")
    }
  },
  timelines: {
    oddballTimeline: {
      id: "oddballTimeline",
      timeline: [
        {
          id: "interTrial",
          type: "callback_image_display",
          stimulus: "./assets/cat_dog/fixation.jpg",
          trial_duration: () => params.iti + Math.random() * params.jitter,
          post_trial_gap: 0
        },
        {
          id: "trial",
          stimulus: jsPsych.timelineVariable("stimulusVar"),
          on_load: jsPsych.timelineVariable("callbackVar"),
          type: params.plugin_name,
          choices: ["f", "j"],
          trial_duration: params.trial_duration,
          post_trial_gap: 0
        }
      ],
      sample: {
        type: "custom",
        fn: oddballSamplingFn
      },
      timeline_variables: readdirSync(targetsDir)
        .map(filename => ({
          stimulusVar: targetsDir.replace("app/", "") + filename,
          callbackVar: () => callback("target")
        }))
        .concat(
          readdirSync(nontargetsDir).map(filename => ({
            stimulusVar: nontargetsDir.replace("app/", "") + filename,
            callbackVar: () => callback("nontarget")
          }))
        )
    }
  }
});
