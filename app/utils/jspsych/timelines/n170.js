import { jsPsych } from "jspsych-react";
import { readdirSync } from "fs";

// Default experiment parameters
const params = {
  trial_duration: 300,
  stim_duration: 300,
  iti: 300,
  jitter: 200,
  n_trials: 170, // Around two minutes at a rate of ~700 ms per trial
  plugin_name: "callback_image_display"
};

// Default directories containing stimuli
// Note: there's a weird issue where the fs readdir function reads from BrainWaves dir
// while the timeline reads from Brainwaves/app. Currently removing 'app/' from path in timeline
const facesDir = "./app/assets/face_house/faces/";
const housesDir = "./app/assets/face_house/houses/";

export const buildN170Timeline = callback => ({
  mainTimeline: ["welcome", "faceHouseTimeline", "end"], // array of trial and timeline ids
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
    faceHouseTimeline: {
      id: "faceHouseTimeline",
      timeline: [
        {
          id: "interTrial",
          type: "callback_image_display",
          stimulus: "./assets/face_house/fixation.jpg",
          trial_duration: () => params.iti + Math.random() * params.jitter
        },
        {
          id: "trial",
          stimulus: jsPsych.timelineVariable("stimulusVar"),
          on_load: jsPsych.timelineVariable("callbackVar"),
          type: params.plugin_name,
          choices: ["f", "j"],
          trial_duration: params.trial_duration
        }
      ],
      sample: {
        type: "with-replacement",
        size: params.n_trials
      },
      timeline_variables: readdirSync(facesDir)
        .filter(filename => filename.includes("3"))
        .map(filename => ({
          stimulusVar: facesDir.replace("app/", "") + filename,
          callbackVar: () => callback("face")
        }))
        .concat(
          readdirSync(housesDir)
            .filter(filename => filename.includes("3"))
            .map(filename => ({
              stimulusVar: housesDir.replace("app/", "") + filename,
              callbackVar: () => callback("house")
            }))
        )
    }
  }
});
