import {
  keycap,
  type InstructionsScreenParams,
} from '../shared/participantScreens';
import { params } from './params';

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Faces and houses',
  summary:
    'You will see faces and houses, one at a time. Press 1 for a face, 9 for a house.',
  rules: [
    {
      keys: [
        { key: '1', meaning: 'Face' },
        { key: '9', meaning: 'House' },
      ],
    },
  ],
  decisionRule: `Face → ${keycap('1')} · House → ${keycap('9')}`,
  expect: `${params.nbPracticeTrials} practice pictures that tell you if you were right, then ${params.nbTrials} more without feedback. About 3 minutes in all.`,
  pacing: "Answer as soon as you're sure. This isn't a speed test.",
  eyes: 'Keep your eyes on the middle of the screen. Blink just after you answer, not while a picture is showing.',
  canSkipPractice: true,
};

/** Practice feedback (a lab.js template on the Feedback canvas): praise, or the right answer and its key. */
export const practiceFeedback =
  "${ state.correct_response ? 'Well done!' : 'That was a ' + parameters.condition.toLowerCase() + ' — press ' + parameters.response }";
