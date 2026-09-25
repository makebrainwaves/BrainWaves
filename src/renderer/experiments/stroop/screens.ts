import {
  keycap,
  stimulusExamples,
  type InstructionsScreenParams,
} from '../shared/participantScreens';

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Stroop task',
  summary:
    'You will see color words printed in colored ink. Press the key for the ink color, not the word.',
  example: stimulusExamples([
    {
      stimulus: '<span style="color: red">green</span>',
      label: 'Red ink',
      detail: `The word says “green”. Press ${keycap('r')}`,
    },
    {
      stimulus: '<span style="color: blue">yellow</span>',
      label: 'Blue ink',
      detail: `The word says “yellow”. Press ${keycap('b')}`,
    },
  ]),
  rules: [
    {
      keys: [
        { key: 'r', meaning: 'Red' },
        { key: 'g', meaning: 'Green' },
        { key: 'b', meaning: 'Blue' },
        { key: 'y', meaning: 'Yellow' },
      ],
    },
  ],
  pacing: 'Answer quickly, and as accurately as you can.',
  canSkipPractice: true,
};
