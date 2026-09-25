import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 1000,
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimulus1: {
    title: 'No switching',
    type: EVENTS.STIMULUS_1,
    response: '1',
  },
  stimulus2: {
    title: 'Switching',
    type: EVENTS.STIMULUS_2,
    response: '9',
  },
  stimuli: [
    {
      title: 'No switching',
      condition: 'No switching',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    {
      title: 'Switching',
      condition: 'Switching',
      type: EVENTS.STIMULUS_2,
      response: '9',
    },
  ],
} satisfies ExperimentParameters;
