import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

const stimuli = ['Face1', 'Face2', 'Face3', 'Face4', 'Face5', 'Face6', 'Face7', 'Face8', 'Face9', 'Face10',
'Face11', 'Face12', 'Face13', 'Face14', 'Face15', 'Face16', 'Face17', 'Face18', 'Face19', 'Face20',
'Face21', 'Face22', 'Face23', 'Face24', 'Face25', 'Face26', 'Face27', 'Face28', 'Face29', 'Face30',
'House1', 'House2', 'House3', 'House4', 'House5', 'House6', 'House7', 'House8', 'House9', 'House10',
'House11', 'House12', 'House13', 'House14', 'House15', 'House16', 'House17', 'House18', 'House19', 'House20',
'House21', 'House22', 'House23', 'House24', 'House25', 'House26', 'House27', 'House28', 'House29', 'House30'].map(s => ({
  condition: s.startsWith('Face') ? 'Face' : 'House',
  dir: s.startsWith('Face') ? facesDir : housesDir,
  filename: `${s}.jpg`,
  name: s,
  response: s.startsWith('Face') ? '1' : '9',
  phase: 'main',
  type: s.startsWith('Face') ? EVENTS.STIMULUS_1 : EVENTS.STIMULUS_2,
}))

// phase: ['Face1', 'House1'].includes(s) ? 'practice' : 'main',

export const buildN170Timeline = () => ({
  overview_title: `Faces Houses Experiment`,
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
  protocol: `In the Faces/Houses experiment, participants will see pictures of different faces and houses.`,
  protocol_condition_first_img: `conditionFace`,
  protocol_condition_first_title: `Faces`,
  protocol_condition_first: `When participants see a face, they should press the key “1”.`,
  protocol_condition_second_img: `conditionHouse`,
  protocol_condition_second_title: `Houses`,
  protocol_condition_second: `If participants see a house, they should press “9”.`,
  overview_links: [],
  background_links: [
    {
      name: 'Link 1',
      address: 'https://www.cnn.com/videos/health/2011/01/04/sacks.face.blindness.cnn',
    },
  ],
  protocal_links: [],
  params: {
    imageHeight: '500px',
    randomize: 'random',
    includePractice: true,
    trialDuration: 1000,
    nbTrials: 120,
    nbPracticeTrials: 6,
    iti: 500,
    presentationTime: 1000,
    selfPaced: true,
    jitter: 200,
    sampleType: 'with-replacement',
    intro: `You will view a series of faces and houses. Press 1 when a face appears and 9 for a house. Press the the space bar on your keyboard to start doing the practice trials. If you want to skip the practice trials and go directly to the task, press the "q" button on your keyboard.`,
    taskHelp: `Press 1 for a face and 9 for a house`,
    showProgressBar: false,
    stimulus1: {
      dir: facesDir,
      title: 'Face',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    stimulus2: {
      dir: housesDir,
      title: 'House',
      type: EVENTS.STIMULUS_2,
      response: '9',
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
    stimuli,
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
