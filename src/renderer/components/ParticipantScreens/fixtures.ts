import type { InstructionsScreenParams } from '../../experiments/shared/participantScreens';

/** Keys and pacing from faces_houses/content_protocol.js and params.ts. */
export const FACES_HOUSES: InstructionsScreenParams = {
  title: 'Faces and houses',
  summary: 'You will see a series of pictures. Each one is a face or a house.',
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

/** Keys from the Stroop screen responses in stroop/experiment.ts; pacing from its instruction screen. */
export const STROOP: InstructionsScreenParams = {
  title: 'Stroop task',
  summary:
    'You will see color words printed in colored ink. Press the key for the ink color, not the word.',
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

/** Keys and pacing from search/content_protocol.js. */
export const VISUAL_SEARCH: InstructionsScreenParams = {
  title: 'Visual search',
  summary:
    'Look for the right-side-up orange T. Ignore upside-down orange Ts and blue Ts.',
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
