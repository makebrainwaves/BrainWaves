import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import face from './stimuli/faces/Face1.jpg';
import house from './stimuli/houses/House1.jpg';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/** What Prepare shows for Faces/Houses: its keys (params.ts stimuli) and its real 6 / 120 trials. */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  compare: {
    conditions: ['Face', 'House'],
    measure:
      'The brain response about 170 ms after each picture, at TP9 and TP10 (the sensors near the ears)',
    whereInAnalyze: 'ERP tab, with TP9 or TP10 selected',
  },
  prediction: {
    question:
      'About 170 ms after each picture, at TP9 and TP10, how will the brain response to faces compare with houses?',
    conditions: ['Face', 'House'],
    measure: 'erp',
    options: [
      { direction: 'a<b', label: 'Face dips lower than House around 170 ms' },
      { direction: 'a=b', label: 'Face and House about the same' },
      { direction: 'a>b', label: 'House dips lower than Face around 170 ms' },
    ],
    lookFor:
      'Pick TP9 or TP10 and look about 170 ms after the picture: if the Face line dips clearly below the House line there, the data fit a bigger face response; lines that overlap there do not.',
  },
  teacherNote:
    'If you record EEG, ask the participant to keep their eyes on the picture and blink just after answering, not during the cross or the picture: the cross is the baseline before each picture. Blinks show up as big spikes.',
  responses: [
    { key: '1', label: 'Face', stimulus: { src: face, alt: 'A face photo' } },
    {
      key: '9',
      label: 'House',
      stimulus: { src: house, alt: 'A house photo' },
    },
  ],
  // Practice and Experiment loops are sized by params.ts nbPracticeTrials 6 / nbTrials 120 (functions.ts initPracticeLoopWithStimuli / initLoopWithStimuli).
  flow: flowFromStructure({ practice: 6, recorded: 120 }),
};
