import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const buildMultiTimeline = () => ({
  overview_title: `Multi-Tasking Experiment`,
  overview: `Imagine doing your homework while watching television.
  Multitasking can be defined as our (in)ability to complete multiple tasks at the same time.`,
  background_first_column: `We are constantly facing different tasks at the same time:
    doing your homework while watching TV, writing emails and also responding to your friend’s text messages, etc.
    Some people pride themselves with being “good multitaskers.” But is this scientifically plausible?`,
  background_first_column_question: `Are some people better than others at performing multiple tasks at the same time?`,
  background_second_column: `Some research suggests that good multitaskers are actually not performing different tasks simultaneously,
    but are instead rapidly switching back ‘n forth between different tasks (click here to read more about this research).
    Other research suggests that our brains are able to distribute different tasks across hemispheres
    (you can read more about it here).`,
  background_second_column_question: `Do you think some people could be better brain ‘distributors’ than others?`,
  protocol_title: `What participants are shown`,
  protocol: `Participants are shown either a square or diamonds with dots inside.
    The location of the object on the screen indicates which rule the participant needs to follow`,
  protocol_condition_first_img: `multiConditionShape`,
  protocol_condition_first_title: `Rule 1`,
  protocol_condition_first: `If the object is shown on top, they need to respond to the shape (pressing ‘n’ for square and ‘b’ for diamond).`,
  protocol_condition_second_img: `multiConditionDots`,
  protocol_condition_second_title: `Rule 2`,
  protocol_condition_second: `If the object is shown on the bottom, they need to respond to the number of dots inside (pressing ‘n’ for 3 dots and ‘b’ for 2 dots). `,
  params: {
    trialDuration: 1000,
    nbTrials: 150,
    iti: 500,
    jitter: 200,
    sampleType: 'with-replacement',
    pluginName: 'callback-image-display',
    intro: 'You will see the multi-tasking test. Press any key to continue',
    showProgressBar: false,
    stimulus1: {
      dir: facesDir,
      title: 'Face',
      type: EVENTS.STIMULUS_1,
      response: '1'
    },
    stimulus2: {
      dir: housesDir,
      title: 'House',
      type: EVENTS.STIMULUS_2,
      response: '9'
    }
  },
  mainTimeline: ['intro', 'faceHouseTimeline', 'end'], // array of trial and timeline ids
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
      id: 'faceHouseTimeline',
      timeline: [
        {
          id: 'interTrial',
          type: 'callback-image-display',
          stimulus: fixation,
          response_ends_trial: false
        },
        {
          id: 'trial',
          response_ends_trial: false
        }
      ]
    }
  }
});
