import { jsPsych } from "jspsych-react";
import { readdirSync } from "fs";
import { EVENTS } from "../../../constants/constants"; 
// Default experiment parameters
const params = {
  trial_duration: 300,
  stim_duration: 300,
  iti: 300,
  jitter: 200,
  n_trials: 170, // 170 Around two minutes at a rate of ~700 ms per trial
  plugin_name: "callback-image-display"
};

// Default directories containing stimuli
// Note: there's a weird issue where the fs readdir function reads from BrainWaves dir
// while the timeline reads from Brainwaves/app. Currently removing 'app/' from path in timeline
const facesDir = "./app/assets/face_house/faces/";
const housesDir = "./app/assets/face_house/houses/";

export const buildN170Timeline = () => ({
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
          stimulus: "./assets/face_house/fixation.jpg",
          trial_duration: () => params.iti + Math.random() * params.jitter
        },
        {
          id: "trial",
          stimulus: jsPsych.timelineVariable("stimulusVar"),
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
          eventTypeVar: EVENTS.FACE
        }))
        .concat(
          readdirSync(housesDir)
            .filter(filename => filename.includes("3"))
            .map(filename => ({
              stimulusVar: housesDir.replace("app/", "") + filename,
              eventTypeVar: EVENTS.HOUSE
            }))
        )
    }
  }
});
