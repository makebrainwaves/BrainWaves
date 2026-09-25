import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 500,
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimuli: [
    {
      title: '5 and 10 letters',
      condition: '5 and 10 letters',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    {
      title: '15 and 20 letters',
      condition: '15 and 20 letters',
      type: EVENTS.STIMULUS_2,
      response: '9',
    },
  ],
} satisfies ExperimentParameters;
