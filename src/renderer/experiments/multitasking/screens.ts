import type {
  InstructionsScreenParams,
  KeyMapping,
} from '../shared/participantScreens';

/** The two rules (utils.ts initTasks: top = shape rule, bottom = dots rule) on the same b / n keys. */
const RULES: {
  where: string;
  rule: string;
  question: string;
  keys: Required<KeyMapping>[];
}[] = [
  {
    where: 'Top',
    rule: 'shape',
    question: 'What shape is it? Ignore the dots.',
    keys: [
      { key: 'b', meaning: 'Diamond' },
      { key: 'n', meaning: 'Rectangle' },
    ],
  },
  {
    where: 'Bottom',
    rule: 'dots',
    question: 'How many dots? Ignore the shape.',
    keys: [
      { key: 'b', meaning: '2 dots' },
      { key: 'n', meaning: '3 dots' },
    ],
  },
];

/**
 * The intro screen. Space continues to Multitasking's own instruction screens
 * (skip-practice lives there), so no Q hint. Block and trial counts are the
 * experiment's Block loop rows.
 */
export const instructions: InstructionsScreenParams = {
  title: 'Multitasking',
  summary:
    'A shape appears at the top or bottom of the frame. Its position tells you which question to answer.',
  rules: RULES.map(({ where, question, keys }) => ({
    when: `${where} → ${question}`,
    keys,
  })),
  expect:
    "You'll practice each rule on its own, then both mixed: 3 practice blocks, 40 trials. Then the same 3 blocks for real: 80 trials. In the mixed block the position can change from trial to trial. That's the hard part, and it's what we're measuring.",
  pacing:
    'Answer as fast as you can without making mistakes. You have 5 seconds per trial. After a wrong key or no answer, the task pauses for 3 seconds and shows the keys. You can rest on the screen before each block.',
  start: 'see the instructions',
};

/** The rule table as plain lines, for the canvas block screens. */
export const ruleLines = RULES.map(
  ({ where, rule, keys }) =>
    `${where} → ${rule}:  ${keys
      .map(({ key, meaning }) => `${meaning} = ${key.toUpperCase()}`)
      .join(',  ')}`
);

/** The trial frame's footer: the rule table, small, under every block and trial screen. */
export const ruleFooter = `<footer class="content-vertical-center content-horizontal-center bw-multitasking-rules">${RULES.map(
  ({ where, rule, keys }) =>
    `<div>${where} → ${rule}: ${keys
      .map(({ key, meaning }) => `${meaning} <kbd>${key}</kbd>`)
      .join(', ')}</div>`
).join('')}</footer>`;
