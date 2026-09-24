import {
  keycap,
  stimulusExamples,
  type InstructionsScreenParams,
} from '../../experiments/shared/participantScreens';

/** A search-task letter with the same `letter` class and inline styles the task's run hook sets. */
const searchLetter = (style: string) =>
  `<span class="letter" style="${style}">T</span>`;

/** Keys and pacing from faces_houses/content_protocol.js and params.ts. */
export const FACES_HOUSES: InstructionsScreenParams = {
  title: 'Faces and houses',
  summary:
    'You will see a series of face and house images. Press the right key when an image appears',
  rules: [
    {
      keys: [
        { key: '1', meaning: 'Face' },
        { key: '9', meaning: 'House' },
      ],
    },
  ],
  pacing:
    "This isn't a speed test. Take about 1–1.5 seconds per picture and answer carefully.",
  canSkipPractice: true,
};

/**
 * Keys from the Stroop screen responses in stroop/experiment.ts; pacing from its
 * instruction screen. The example uses the task's own ink colors.
 */
export const STROOP: InstructionsScreenParams = {
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

/** Keys and pacing from search/content_protocol.js; example letters as the task draws them. */
export const VISUAL_SEARCH: InstructionsScreenParams = {
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

/**
 * Multitasking's intro screen. Space continues to its own instruction
 * screens (skip-practice lives there), so no Q hint. Keys from
 * multitasking/content_protocol.js and its instruction screens.
 */
export const MULTITASKING: InstructionsScreenParams = {
  title: 'Multitasking',
  summary:
    'You will see a shape with dots inside. Where it appears tells you which rule to follow. The next screens explain each rule with examples.',
  rules: [
    {
      when: 'Shape on top: answer the shape',
      keys: [
        { key: 'b', meaning: 'Diamond' },
        { key: 'n', meaning: 'Rectangle' },
      ],
    },
    {
      when: 'Shape on the bottom: count the dots',
      keys: [
        { key: 'b', meaning: '2 dots' },
        { key: 'n', meaning: '3 dots' },
      ],
    },
  ],
  pacing: 'Speed counts here: answer as fast as you can without making errors.',
  start: 'see the instructions',
};

/**
 * A teacher-built custom experiment. The summary is the teacher's intro,
 * filled in by lab.js from `parameters.intro`. Custom has no protocol pacing.
 */
export const CUSTOM: InstructionsScreenParams = {
  title: 'Animals',
  summary: '${this.parameters.intro}',
  rules: [
    {
      keys: [
        { key: '1', meaning: 'Dog' },
        { key: '9', meaning: 'Cat' },
        { meaning: 'Bird: just watch' },
      ],
    },
  ],
  canSkipPractice: true,
};

export const CUSTOM_INTRO =
  "You'll see pictures of animals. Press the key for the animal you see.";

/**
 * Stress case: a teacher intro as long as the four-row intro textarea holds,
 * and four conditions on the default keys for four (1, 4, 6, 9).
 */
export const CUSTOM_FOUR_KEYS: InstructionsScreenParams = {
  title: 'Animals of the rainforest',
  summary: '${this.parameters.intro}',
  rules: [
    {
      keys: [
        { key: '1', meaning: 'Monkey' },
        { key: '4', meaning: 'Parrot' },
        { key: '6', meaning: 'Frog' },
        { key: '9', meaning: 'Jaguar' },
      ],
    },
  ],
  canSkipPractice: true,
};

export const CUSTOM_LONG_INTRO =
  "In this experiment you'll see photos of four rainforest animals, one at a time, in the middle of the screen. Each photo stays up for about a second. As soon as you recognize the animal, press its key. Keep your fingers resting on the four keys the whole time so you don't have to look down. If you're not sure, make your best guess and get ready for the next photo.";
