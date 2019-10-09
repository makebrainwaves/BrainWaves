import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const buildMultiTimeline = () => ({
  overview: 'Here is the placeholder for the overview of the Multi-tasking task',
  background: 'Here is the background of the Multi-tasking task',
  background_title: `Title`,
  protocol: 'Here is the protocol of the Multi-tasking task',
  params: {
    trialDuration: 1000,
    nbTrials: 150,
    iti: 500,
    jitter: 200,
    sampleType: 'with-replacement',
    pluginName: 'callback-image-display',
    intro:
      'You will see the multi-tasking test. Press 1 when a face appears and 9 for a house. Press any key to continue',
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
