import { EVENTS } from '../../constants/constants';
import {
  ExperimentDescription,
  ExperimentParameters,
  StimulusCondition,
} from '../../constants/interfaces';
import {
  assignDefaultResponses,
  emptyConditionSlot,
} from '../../utils/labjs/customStimuli';

export const params = {
  randomize: 'random',
  trialDuration: 1000,
  imageHeight: '500px',
  nbTrials: 0,
  nbPracticeTrials: 0,
  iti: 500,
  presentationTime: 1000,
  selfPaced: true,
  sampleType: 'with-replacement',
  intro: '',
  taskHelp: '',
  showProgressBar: false,
  description: {
    question: '',
    hypothesis: '',
    methods: '',
  },
  stimulus1: emptyConditionSlot(EVENTS.STIMULUS_1, 'Condition 1'),
  stimulus2: emptyConditionSlot(EVENTS.STIMULUS_2, 'Condition 2'),
  stimulus3: emptyConditionSlot(EVENTS.STIMULUS_3, ''),
  stimulus4: emptyConditionSlot(EVENTS.STIMULUS_4, ''),
  stimuli: [],
} satisfies ExperimentParameters;

export type CustomParamsInput = Omit<
  Partial<ExperimentParameters>,
  'description' | 'stimulus1' | 'stimulus2' | 'stimulus3' | 'stimulus4'
> & {
  description?: Partial<ExperimentDescription>;
  stimulus1?: Partial<StimulusCondition>;
  stimulus2?: Partial<StimulusCondition>;
  stimulus3?: Partial<StimulusCondition>;
  stimulus4?: Partial<StimulusCondition>;
};

/**
 * Restores a saved custom experiment, filling in anything the stored workspace
 * is missing.
 *
 * This also re-runs the default response-key assignment. Conditions used to get
 * a key only at the moment their stimulus folder was picked, so an experiment
 * built before that existed — or one whose folders were set some other way —
 * could reach data collection with no expected key at all. Every trial then
 * scored as incorrect, which is indistinguishable from a participant getting
 * everything wrong: 0% accuracy and no reaction times, with no error anywhere.
 * Assignment only touches conditions that have no key, so a chosen key stands.
 */
export function mergeCustomParams(
  restored: CustomParamsInput = {}
): ExperimentParameters {
  return assignDefaultResponses({
    ...params,
    ...restored,
    description: { ...params.description, ...restored.description },
    stimulus1: { ...params.stimulus1, ...restored.stimulus1 },
    stimulus2: { ...params.stimulus2, ...restored.stimulus2 },
    stimulus3: { ...params.stimulus3, ...restored.stimulus3 },
    stimulus4: { ...params.stimulus4, ...restored.stimulus4 },
  });
}
