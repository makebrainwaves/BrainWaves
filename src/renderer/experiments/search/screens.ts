import {
  keycap,
  stimulusExamples,
  type InstructionsScreenParams,
} from '../shared/participantScreens';

/** The task's inline letter styles (its run hook's), by code: target, upside-down, blue. */
const LETTER_STYLES: Record<string, string> = {
  T: 'color: orange',
  u: 'color: orange; transform: rotate(-180deg)',
  b: 'color: lightblue',
};

/**
 * A small search picture in the task's `letter` markup, one cell per
 * character of `rows` (a `LETTER_STYLES` code, or `.` for an empty cell).
 */
const searchGrid = (rows: string) =>
  `<div class="bw-participant-search-grid">${[...rows.replace(/ /g, '')]
    .map((code) =>
      LETTER_STYLES[code]
        ? `<span><span class="letter" style="${LETTER_STYLES[code]}">T</span></span>`
        : '<span></span>'
    )
    .join('')}</div>`;

/** What participants are told before practice and reminded of before the recorded trials. */
export const instructions: InstructionsScreenParams = {
  title: 'Visual search',
  summary:
    'Look for the right-side-up orange T. Ignore upside-down orange Ts and blue Ts.',
  example: stimulusExamples([
    {
      stimulus: searchGrid('b.u. ..b. u..T .b..'),
      label: 'Orange T is there',
      detail: `Press ${keycap('b')}`,
    },
    {
      stimulus: searchGrid('.u.b b... ..u. u.b.'),
      label: 'No orange T',
      detail: `Checked it all? Press ${keycap('n')}`,
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
  decisionRule: `Orange T → ${keycap('b')} · No orange T anywhere → ${keycap('n')}`,
  expect:
    '8 practice pictures that tell you if you were right, then 80 more without feedback. About 4 minutes in all.',
  pacing:
    "Find the orange T as quickly as you can. Only press N after you've checked the whole picture.",
  eyes: 'Keep your head and body still; let your eyes search the picture.',
  canSkipPractice: true,
};
