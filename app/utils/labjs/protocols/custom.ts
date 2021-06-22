import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// Default directories containing stimuli
const rootFolder = process.resourcesPath; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const buildCustomTimeline = () => ({
  overview_title: `Custom Experiment`,
  overview: `When you scroll through your social media feed, you may find that you are more likely to pause when a picture
    contains a face, than, for example, a tree.
    In this experiment, you will explore whether our brains process faces differently than other objects (in this case, houses).`,
  background_first_column: `Did you know that we spend more time looking at faces than any other type of stimuli?
    Faces contain a lot of information that is relevant to our day-to-day lives.
    For example, by looking at someone’s face we can assess their emotional state.
    This has led researchers speculate that faces may be processed differently than other stimuli.`,
  background_first_column_question: `In fact, there is a special area in your brain, the Fusiform Face Area, that has been shown to be selective for faces.
  People who have damage in this area may have a hard time recognizing faces, a condition called face blindness, or prosopagnosia.`,
  background_second_column: `In the video (Link 1) the famous neurologist Oliver Sacks explains what it is like to have face blindness to the extent
  that he sometimes didn’t even recognize his own face (!)`,
  background_second_column_question: `Fun fact: Brad Pitt claims he has face blindness, but he has not been tested.
    Do you know anyone who has face blindness?`,
  protocol_title: `What participants are shown`,
  protocol: `In the Faces/Houses experiment, you will see pictures of different faces and houses.`,
  protocol_condition_first_img: `conditionFace`,
  protocol_condition_first_title: `Faces`,
  protocol_condition_first: `When you see a face, press the key “1”.`,
  protocol_condition_second_img: `conditionHouse`,
  protocol_condition_second_title: `Houses`,
  protocol_condition_second: `If you see a house, press “9”.`,
  overview_links: [],
  background_links: [
    {
      name: 'Link 1',
      address:
        'https://www.cnn.com/videos/health/2011/01/04/sacks.face.blindness.cnn',
    },
  ],
  protocol_links: [],
  params: {
    imageHeight: '500px',
    randomize: 'random',
    includePractice: true,
    trialDuration: 1000,
    nbTrials: 0,
    nbPracticeTrials: 0,
    iti: 500,
    presentationTime: 1000,
    selfPaced: true,
    jitter: 200,
    sampleType: 'with-replacement',
    intro: '',
    taskHelp: '',
    showProgressBar: false,
    stimulus1: {
      dir: '',
      title: 'Condition 1',
      type: EVENTS.STIMULUS_1,
      response: '',
    },
    stimulus2: {
      dir: '',
      title: 'Condition 2',
      type: EVENTS.STIMULUS_2,
      response: '',
    },
    stimulus3: {
      dir: '',
      title: '',
      type: 3,
      response: '',
    },
    stimulus4: {
      dir: '',
      title: '',
      type: 4,
      response: '',
    },
    stimuli: [],
  },
  mainTimeline: ['intro', 'faceHouseTimeline', 'end'], // array of trial and timeline ids
  trials: {
    intro: {
      type: 'callback-html-display',
      id: 'intro',
      post_trial_gap: 1000,
    },
    end: {
      id: 'end',
      type: 'callback-html-display',
      stimulus: 'Thanks for participating. Press any key to continue',
      response_ends_trial: true,
      post_trial_gap: 500,
    },
  },
  timelines: {
    faceHouseTimeline: {
      id: 'faceHouseTimeline',
      timeline: [
        {
          id: 'interTrial',
          type: 'callback-image-display',
          stimulus: fixation,
          response_ends_trial: false,
        },
        {
          id: 'trial',
          response_ends_trial: false,
        },
      ],
    },
  },
});
