import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/** What Prepare shows for Stroop: the ink-color keys from experiment.ts (the word never matches the ink) and its real 8 / 96 trials. */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  compare: {
    conditions: ['Mismatch', 'Match'],
    measure: 'Response time, and how often the answer is right',
    whereInAnalyze: 'Behavior tab: Response time, then Accuracy',
  },
  prediction: {
    question:
      'How will response times on Mismatch trials compare with Match trials?',
    conditions: ['Mismatch', 'Match'],
    measure: 'rt',
    options: [
      { direction: 'a>b', label: 'Mismatch slower than Match' },
      { direction: 'a=b', label: 'Mismatch and Match about the same speed' },
      { direction: 'a<b', label: 'Mismatch faster than Match' },
    ],
    lookFor:
      'With Measure on Response time, compare the Mismatch bars with the Match bars: taller means slower, so a taller Mismatch bar means the word got in the way.',
  },
  teacherNote:
    'Check the participant can tell red, green, blue and yellow apart before you start. If you record EEG, ask them to blink just after answering, not while a word is showing.',
  responses: [
    { key: 'r', label: 'Red ink', stimulus: { word: 'green', color: 'red' } },
    {
      key: 'g',
      label: 'Green ink',
      stimulus: { word: 'blue', color: 'green' },
    },
    {
      key: 'b',
      label: 'Blue ink',
      stimulus: { word: 'yellow', color: 'blue' },
    },
    {
      key: 'y',
      label: 'Yellow ink',
      stimulus: { word: 'red', color: '#ffe32a' },
    },
  ],
  // experiment.ts: 'Practice task' loop has 8 templateParameters; 'Stroop task' loop samples n: '96'. params.nbTrials is unused.
  flow: flowFromStructure({ practice: 8, recorded: 96 }),
};
