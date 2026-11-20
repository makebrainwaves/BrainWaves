import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 1000,
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimulus1: {
    title: 'Single rule',
    type: EVENTS.STIMULUS_1,
    response: '1',
  },
  stimulus2: {
    title: 'Mixed rules',
    type: EVENTS.STIMULUS_2,
    response: '9',
  },
  stimuli: [
    {
      title: 'Single rule',
      condition: 'Single rule',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    {
      title: 'Mixed rules',
      condition: 'Mixed rules',
      type: EVENTS.STIMULUS_2,
      response: '9',
    },
  ],
} satisfies ExperimentParameters;
