import {
  stimulusExamples,
  type InstructionsScreenParams,
} from '../shared/participantScreens';

/** A search-task letter with the same `letter` class and inline styles the task's run hook sets. */
const searchLetter = (style: string) =>
  `<span class="letter" style="${style}">T</span>`;

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Visual search',
  summary:
    'Look for the right-side-up orange T. Ignore upside-down orange Ts and blue Ts.',
  example: stimulusExamples([
    {
      stimulus: searchLetter('color: orange'),
      label: 'Find this',
      detail: 'Orange T, right side up',
    },
    {
      stimulus: searchLetter('color: orange; transform: rotate(-180deg)'),
      label: 'Ignore',
      detail: 'Upside-down orange T',
    },
    {
      stimulus: searchLetter('color: lightblue'),
      label: 'Ignore',
      detail: 'Blue T',
    },
  ]),
  rules: [
    {
      keys: [
        { key: 'b', meaning: 'Orange T is there' },
        { key: 'n', meaning: 'No orange T' },
      ],
    },
  ],
  pacing:
    'Speed counts here: find the orange T as quickly as you can, without guessing.',
  canSkipPractice: true,
};
