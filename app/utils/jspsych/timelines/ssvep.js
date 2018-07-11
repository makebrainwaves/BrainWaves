import { jsPsych } from "jspsych-react";

// Default experiment parameters
const params = {
  stim_duration: 3000,
  iti: 500,
  jitter: 200,
  n_trials: 34, // Around two minutes at a rate of ~3600 ms per trial
  plugin_name: "animation"
};

export const buildSSVEPTimeline = callback => ({
  mainTimeline: ["welcome", "ssvepTimeline", "end"], // array of trial and timeline ids
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
    ssvepTimeline: {
      id: "ssvepTimeline",
      timeline: [
        {
          id: "interTrial",
          type: "callback_image_display",
          stimulus: "./assets/face_house/fixation.jpg",
          trial_duration: () => params.iti + Math.random() * params.jitter
        },
        {
          id: "trial",
          stimuli: [
            "./assets/ssvep/Checkerboard_pattern.svg",
            "./assets/ssvep/Checkerboard_pattern_neg.svg"
          ],
          on_load: jsPsych.timelineVariable("callbackVar"),
          type: params.plugin_name,
          frame_time: jsPsych.timelineVariable("stim_periodVar"),
          sequence_reps: jsPsych.timelineVariable("repsVar")
        }
      ],
      sample: {
        type: "with-replacement",
        size: params.n_trials
      },
      timeline_variables: [
        // reps uses a weird equation I had to derive to get stimulus duration to match up to our parameter
        {
          stim_periodVar: 1000 / 30,
          repsVar: Math.floor(params.stim_duration / (1000 / 30) - 1) / 2,
          callbackVar: () => callback("30")
        },
        {
          stim_periodVar: 1000 / 20,
          repsVar: Math.floor(params.stim_duration / (1000 / 20) - 1) / 2,
          callbackVar: () => callback("20")
        }
      ]
    }
  }
});
