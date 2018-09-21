import * as path from "path";
import { EVENTS } from "../../../constants/constants";

// Default directories containing stimuli
const rootFolder = __dirname;// Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

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
    stimulus1: { dir: facesDir, title: "Face", type: EVENTS.FACE },
    stimulus2: { dir: housesDir, title: "House", type: EVENTS.HOUSE }
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
        },
        {
          id: "trial",
          choices: ["f", "j"]
        }
      ]
    }
  }
});
