import { jsPsych } from "jspsych-react";

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

// Default callback
const callback = value => console.log(value, new Date().getTime());

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

export const timeline = {
  mainTimeline: ["welcome", "oddballProcedure", "end"], // array of trial and timeline ids
  welcome: {
    type: "callback_html_display",
    id: "welcome",
    stimulus: "Welcome to the experiment. Press any key to begin.",
    post_trial_gap: 1000,
    on_load: () => callback("start")
  },
  oddballProcedure: {
    id: "oddballProcedure",
    timeline: [
      {
        type: "callback_image_display",
        stimulus: "./assets/fixation.jpg",
        trial_duration: () => params.iti + Math.random() * params.jitter,
        post_trial_gap: 0
      },
      {
        stimulus: jsPsych.timelineVariable("stimulus"),
        on_load: jsPsych.timelineVariable("callback"),
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
    // TODO: Write function that automatically generates this from reading dir
    timeline_variables: [
      {
        stimulus: "./assets/p300/target-1.jpg",
        callback: () => callback("target")
      },
      {
        stimulus: "./assets/p300/target-2.jpg",
        callback: () => callback("target")
      },
      {
        stimulus: "./assets/p300/target-3.jpg",
        callback: () => callback("target")
      },
      {
        stimulus: "./assets/p300/target-4.jpg",
        callback: () => callback("target")
      },
      {
        stimulus: "./assets/p300/nontarget-1.jpg",
        callback: () => callback("non-target")
      },
      {
        stimulus: "./assets/p300/nontarget-2.jpg",
        callback: () => callback("non-target")
      },
      {
        stimulus: "./assets/p300/nontarget-3.jpg",
        callback: () => callback("non-target")
      },
      {
        stimulus: "./assets/p300/nontarget-4.jpg",
        callback: () => callback("non-target")
      }
    ]
  },
  end: {
    id: "end",
    type: "callback_html_display",
    stimulus: "Thanks for participating",
    post_trial_gap: 500,
    on_load: callback("stop")
  }
};
