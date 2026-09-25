import type { InstructionsScreenParams } from '../shared/participantScreens';

/**
 * The intro screen. Space continues to Multitasking's own instruction screens
 * (skip-practice lives there), so no Q hint.
 */
export const instructions: InstructionsScreenParams = {
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
