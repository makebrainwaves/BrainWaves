import type { InstructionsScreenParams } from '../../experiments/shared/participantScreens';

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
