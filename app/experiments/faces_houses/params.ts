import * as path from 'path';
import { EVENTS, RESOURCE_PATH } from '../../constants/constants';

const parentDir = path.join(
  RESOURCE_PATH,
  'experiments',
  'faces_houses',
  'stimuli'
);
const facesDir = path.join(parentDir, 'faces');
const housesDir = path.join(parentDir, 'houses');

const stimuli = Array.from({ length: 30 }, (_, i) => `Face${i + 1}`)
  .concat(Array.from({ length: 30 }, (v, k) => `House${k + 1}`))
  .map((s) => ({
    title: s,
    condition: s.startsWith('Face') ? 'Face' : 'House',
    dir: s.startsWith('Face') ? facesDir : housesDir,
    filename: `${s}.jpg`,
    name: s,
    response: s.startsWith('Face') ? '1' : '9',
    phase: 'main',
    type: s.startsWith('Face') ? EVENTS.STIMULUS_1 : EVENTS.STIMULUS_2,
  }));

/**
 * NOTE: this params object may contain additional parameters in use by the experiment that are not
 * explicitly defined in the ExperimentParameters interface, which explicitly defines parameters that can be tweaked
 * in the current custom experiment UI.
 * This inconsistency will likely be able to be fixed when updating to a lab.js builder-based experiment design flow
 *  */
export const params = {
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
  intro: `You will view a series of faces and houses. Press 1 when a face appears
  and 9 for a house. Press the the space bar on your keyboard to start doing the
  practice trials. If you want to skip the practice trials and go directly to
  the task, press the "q" button on your keyboard.`,
  taskHelp: `Press 1 for a face and 9 for a house`,
  showProgressBar: false,
  description: {
    question: '',
    hypothesis: '',
    methods: '',
  },
  // stimulus1: {
  //   dir: facesDir,
  //   title: 'Face',
  //   type: EVENTS.STIMULUS_1,
  //   response: '1',
  // },
  // stimulus2: {
  //   dir: housesDir,
  //   title: 'House',
  //   type: EVENTS.STIMULUS_2,
  //   response: '9',
  // },
  stimuli,
} as const;
