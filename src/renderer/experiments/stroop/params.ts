import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

/**
 * NOTE: this params object may contain additional parameters in use by the experiment that are not
 * explicitly defined in the ExperimentParameters interface, which explicitly defines parameters that can be tweaked
 * in the current custom experiment UI.
 * This inconsistency will likely be able to be fixed when updating to a lab.js builder-based experiment design flow
 *  */
export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 500,
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimuli: [
    {
      title: 'Incongruent',
      condition: 'Incongruent',
      type: EVENTS.STIMULUS_1,
      response: '1',
    },
    {
      title: 'Congruent',
      condition: 'Congruent',
      type: EVENTS.STIMULUS_2,
      response: '9',
    },
  ],
} satisfies ExperimentParameters;
