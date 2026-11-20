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
      label: 'Mismatch',
      detail: `The ink is red. Press ${keycap('r')}`,
    },
    {
      stimulus: '<span style="color: blue">yellow</span>',
      label: 'Mismatch',
      detail: `The ink is blue. Press ${keycap('b')}`,
    },
    {
      stimulus: '<span style="color: green">green</span>',
      label: 'Match',
      detail: `The ink is green and the word says green. Still just press ${keycap('g')}`,
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
  decisionRule: `Ink color → ${keycap('r')} red · ${keycap('g')} green · ${keycap('b')} blue · ${keycap('y')} yellow`,
  expect:
    '8 practice words that tell you if you were right, then 96 more without feedback. About 3 minutes in all.',
  pacing: 'Answer quickly, and as accurately as you can.',
  eyes: 'Keep your eyes on the middle of the screen. Blink just after you answer, not while a word is showing.',
  canSkipPractice: true,
};

/**
 * Practice feedback (a lab.js template on the Inter-trial interval canvas):
 * praise, or the ink color and its key. Yellow ink is drawn as `#ffe32a`.
 */
export const practiceFeedback =
  "${ state.correct ? 'Well done!' : 'The ink was ' + (parameters.color === '#ffe32a' ? 'yellow' : parameters.color) + ' — press ' + (parameters.color === '#ffe32a' ? 'Y' : parameters.color.charAt(0).toUpperCase()) }";
