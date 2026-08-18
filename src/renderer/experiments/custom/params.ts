import { EVENTS } from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { emptyConditionSlot } from '../../utils/labjs/customStimuli';

export const params: ExperimentParameters = {
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
};
