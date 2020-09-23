import { EVENTS } from '../../../constants/constants';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 500,
  jitter: 200,
  sampleType: 'with-replacement',
  intro: `In this experiment, your task will be to identify the color of the
  word shown on the screen. The word itself is immaterial - you can safely
  ignore it.`,
  showProgressBar: false,
  stimulus1: {
    title: 'Incongruent',
    type: EVENTS.STIMULUS_1,
    response: '1',
  },
  stimulus2: {
    title: 'Congruent',
    type: EVENTS.STIMULUS_2,
    response: '9',
  },
};
