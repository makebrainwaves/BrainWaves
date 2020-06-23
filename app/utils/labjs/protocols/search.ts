import * as path from "path";
import { EVENTS } from "../../../constants/constants";

// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const buildSearchTimeline = () => ({
  overview_title: `Visual Search Experiment`,
  overview: `Imagine yourself looking for your keys in a messy room.
    Visual search corresponds to looking for a specific object (e.g. keys) surrounded by other objects (e.g. clothing and books).
    In the Visual Search Task, you will explore how irrelevant objects affect how well you can find the object you are looking for,
    and what this may tell us about how your brain can find and focus on relevant information from all the task-irrelevant
    information around us.`,
  background_first_column: `Say you’re meeting a friend in a public space: do you think it easier to find each other on a street corner
    than in the middle of Times Square around rush hour? What about a parking lot filled with cars?
    Scientists have long wondered how our brains allow us to navigate a world full of irrelevant visual information with such relative ease.
    One way to investigate this is to ask people to complete a visual search task.`,
  background_first_column_question: ``,
  background_second_column: `The hypothesis would be that if you see objects that are very similar to what you are looking for
    (like other people who might look like your friend, as opposed to parked cars),
    these might distract you, making it harder to complete your search.
    Brain scientists aren’t the only ones who are interested in exploring the most optimal way in which visual searches occur.`,
  background_second_column_question: `Can you think of who else might want to know this?`,
  protocol_title: `What participants are shown`,
  protocol: `In the Visual Search Task, participants' goal is to find the right-side up orange T while ignoring upside-down orange T’s or T’s in other colors.`,
  protocol_condition_first_img: `conditionOrangeT`,
  protocol_condition_first_title: `Orange T`,
  protocol_condition_first: `If participants find the orange T, they should press the ‘b’ key. `,
  protocol_condition_second_img: `conditionNoOrangeT`,
  protocol_condition_second_title: `No orange T`,
  protocol_condition_second: `If the orange T is not on the screen, participants should press the ‘n’ key instead.`,
  overview_links: [],
  background_links: [],
  protocal_links: [],
  params: {
    trialDuration: 1000,
    nbTrials: 150,
    iti: 500,
    jitter: 200,
    sampleType: 'with-replacement',
    intro: `You know how difficult it is to find your keys in a messy room. We want to know how good you are in quickly finding your keys. Instead of keys, we just want to know how quickly you can find an orange T amongst blue Ts and upside-down orange Ts. Sounds easy! But it is not at all that easy!`,
    showProgressBar: false,
    stimulus1: {
      dir: facesDir,
      title: '5 and 10 letters',
      type: EVENTS.STIMULUS_1,
      response: '1'
    },
    stimulus2: {
      dir: housesDir,
      title: '15 and 20 letters',
      type: EVENTS.STIMULUS_2,
      response: '9'
    }
  },
  mainTimeline: ['intro', 'visualSearchTimeline', 'end'], // array of trial and timeline ids
  trials: {
    intro: {
      type: 'callback-html-display',
      id: 'intro',
      post_trial_gap: 1000
    },
    end: {
      id: 'end',
      type: 'callback-html-display',
      stimulus: 'Thanks for participating. Press any key to continue',
      response_ends_trial: true,
      post_trial_gap: 500
    }
  },
  timelines: {
    faceHouseTimeline: {
      id: 'visualSearchTimeline',
      timeline: [{
        id: 'interTrial',
        type: 'callback-image-display',
        stimulus: fixation,
        response_ends_trial: false
      }, {
        id: 'trial',
        response_ends_trial: false
      }]
    }
  }
});