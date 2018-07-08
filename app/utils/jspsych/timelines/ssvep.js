import { jsPsych } from "jspsych-react";

// Default experiment parameters
const params = {
  stim_duration: 3000,
  iti: 500,
  jitter: 200,
  n_trials: 34, // Around two minutes at a rate of ~3600 ms per trial
  plugin_name: "animation"
};

let time;
console.log(Math.floor((params.stim_duration / 33.33 - 1) / 2));
// Default callback
const callback = value => {
  console.log(value, new Date().getTime());
};
// TODO: Figure out a way to check refresh rate in Electron. Looks like it hasn't been done before
const refreshRate = 60;

export const ssvepTimeline = {
  mainTimeline: ["welcome", "ssvepProcedure", "end"], // array of trial and timeline ids
  welcome: {
    type: "callback_html_display",
    id: "welcome",
    stimulus: "Welcome to the experiment. Press any key to begin.",
    post_trial_gap: 1000,
    on_load: () => callback("start")
  },
  ssvepProcedure: {
    id: "ssvepProcedure",
    timeline: [
      {
        type: "callback_image_display",
        stimulus: "./assets/face_house/fixation.jpg",
        trial_duration: () => params.iti + Math.random() * params.jitter
      },
      {
        stimuli: [
          "./assets/ssvep/Checkerboard_pattern.svg",
          "./assets/ssvep/Checkerboard_pattern_neg.svg"
        ],
        on_load: jsPsych.timelineVariable("callback"),
        type: params.plugin_name,
        frame_time: jsPsych.timelineVariable("stim_period"),
        sequence_reps: jsPsych.timelineVariable("reps")
      }
    ],
    sample: {
      type: "with-replacement",
      size: params.n_trials
    },
    timeline_variables: [
        // reps uses a weird equation I had to derive to get stimulus duration to match up to our parameter
      {
        stim_period: 1000 / 30,
        reps: Math.floor(params.stim_duration / (1000 / 30) - 1) / 2,
        callback: () => callback("30")
      },
      {
        stim_period: 1000 / 20,
        reps: Math.floor(params.stim_duration / (1000 / 20) - 1) / 2,
        callback: () => callback("20")
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
