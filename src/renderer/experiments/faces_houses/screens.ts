import type { InstructionsScreenParams } from '../shared/participantScreens';

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
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
