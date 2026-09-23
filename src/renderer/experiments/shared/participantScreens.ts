/**
 * Builders for the BrainWaves-owned lab.js participant screens (instructions,
 * practice → main transition, end). Each returns a lab.js `content` string:
 * trusted HTML that lab.js runs through lodash `template` with the component's
 * parameter context as `this`, so strings passed in may contain
 * `${this.parameters.x}` placeholders. Styling lives in `.bw-participant`
 * (app.global.css).
 */

/** One response key and what it means, e.g. `1` → "Face". */
export interface KeyMapping {
  /** Key as lab.js reads it (`'1'`, `'r'`). Omit for a condition with no response. */
  key?: string;
  meaning: string;
}

/** A set of key mappings that apply under one rule; `when` labels the rule. */
export interface ResponseRule {
  when?: string;
  keys: KeyMapping[];
}

export interface InstructionsScreenParams {
  title: string;
  /** One short "what you'll do" paragraph. */
  summary: string;
  rules: ResponseRule[];
  /** Speed/accuracy guidance from the experiment's own protocol. Omit if it has none. */
  pacing?: string;
  /** What Space does, completing "Press Space to …". Defaults to "start practice". */
  start?: string;
  /** Show the quiet `Q` skip-practice hint. */
  canSkipPractice?: boolean;
}

export interface TransitionScreenParams {
  rules: ResponseRule[];
  pacing?: string;
}

/** The only shared EEG guidance (plan §7.4); shown when `parameters.isEEGEnabled` is truthy. */
export const STILLNESS_LINE =
  'Remain still and avoid talking while trials are running.';

const kbd = (key: string, extra = '') =>
  `<kbd class="bw-participant-key${extra}">${key}</kbd>`;

const responseRules = (rules: ResponseRule[]) =>
  `<div class="bw-participant-rules">${rules
    .map(
      ({ when, keys }) =>
        `<section>${
          when ? `<div class="bw-participant-rule">${when}</div>` : ''
        }<ul>${keys
          .map(
            ({ key, meaning }) =>
              `<li>${
                key
                  ? kbd(key)
                  : '<span class="bw-participant-key bw-participant-key-none">No key</span>'
              }<span>${meaning}</span></li>`
          )
          .join('')}</ul></section>`
    )
    .join('')}</div>`;

/** Pacing line (static) plus the stillness line, evaluated by lab.js at runtime. */
const notes = (pacing?: string) =>
  `<ul class="bw-participant-notes">${
    pacing ? `<li>${pacing}</li>` : ''
  }\${this.parameters.isEEGEnabled ? '<li>${STILLNESS_LINE}</li>' : ''}</ul>`;

const screen = (main: string, footer: string) =>
  `<div class="bw-participant"><main>${main}</main><footer>${footer}</footer></div>`;

const pressSpace = (action: string) =>
  `<div class="bw-participant-start">Press ${kbd(
    'Space',
    ' bw-participant-key-space'
  )} to ${action}</div>`;

/** Shown before practice: title, summary, key mapping, pacing, Space to start, Q to skip. */
export function instructionsScreen({
  title,
  summary,
  rules,
  pacing,
  start = 'start practice',
  canSkipPractice = false,
}: InstructionsScreenParams): string {
  return screen(
    `<div class="bw-participant-phase">Practice first</div>
<h1>${title}</h1>
<div class="bw-participant-summary">${summary}</div>
${responseRules(rules)}
${notes(pacing)}`,
    `${pressSpace(start)}${
      canSkipPractice
        ? `<div class="bw-participant-skip">Press ${kbd(
            'Q'
          )} to skip practice</div>`
        : ''
    }`
  );
}

/** Between practice and the recorded task: the same mapping again, then Space to begin. */
export function transitionScreen({
  rules,
  pacing,
}: TransitionScreenParams): string {
  return screen(
    `<div class="bw-participant-phase">Practice is over</div>
<h1>The real trials start now</h1>
<div class="bw-participant-summary">Same keys as in practice:</div>
${responseRules(rules)}
${notes(pacing)}`,
    pressSpace('begin')
  );
}

/** Last screen: thank-you, then Space to finish. */
export function endScreen(): string {
  return screen(
    `<h1>Thank you!</h1>
<div class="bw-participant-summary">That's the end of the experiment.</div>`,
    pressSpace('finish')
  );
}
