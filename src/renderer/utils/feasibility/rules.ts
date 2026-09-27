import { CONDITION_SLOTS } from '../labjs/customStimuli';
import type { ExperimentParameters } from '../../constants/interfaces';

export type Verdict = 'feasible' | 'stretch' | 'not-feasible' | 'unclear';

/**
 * The feasibility call for a custom design. Rules decide; the language model
 * only phrases this, so every judgment here is reviewable and testable.
 */
export interface FeasibilityAssessment {
  verdict: Verdict;
  /** What the rules recognized the student is trying to measure. */
  target?: string;
  /** Why the verdict is what it is, in one sentence. */
  reason: string;
  pitfalls: string[];
  /** One concrete adjustment that keeps the spirit of the idea. */
  suggestion: string;
}

interface SignalRule {
  pattern: RegExp;
  verdict: Exclude<Verdict, 'unclear'>;
  target: string;
  reason: string;
  suggestion: string;
}

/**
 * Keyword rules over the question, hypothesis and methods, most limiting first:
 * the first `not-feasible` or `stretch` match wins over any feasible one.
 * ponytail: keyword matching on free text; replace with structured "what are
 * you measuring?" choices in the designer once the rule set settles.
 */
export const SIGNAL_RULES: SignalRule[] = [
  {
    pattern: /\b(lie|lies|lying|liar|deception|deceiv\w*|truth)\b/,
    verdict: 'not-feasible',
    target: 'lie detection',
    reason:
      'No EEG, even in a lab, can reliably tell whether a person is lying.',
    suggestion:
      'Test whether a picture the participant is hiding knowledge of produces a bigger P300 (a brain response to "meaningful" things) than unfamiliar pictures, with the hidden picture shown rarely.',
  },
  {
    pattern:
      /\b(read(ing)? (their |someone'?s |people'?s )?(thoughts|minds?)|mind[- ]reading|what (they|someone|people) (are|is) thinking)\b/,
    verdict: 'not-feasible',
    target: 'reading thoughts',
    reason: 'EEG cannot decode the content of thoughts.',
    suggestion:
      'Ask whether the brain responds differently to two kinds of pictures, like faces versus houses (the N170 response).',
  },
  {
    pattern:
      /\b(amygdala|hippocamp\w*|thalamus|hypothalamus|basal ganglia|brain ?stem|cerebellum|deep brain)\b/,
    verdict: 'not-feasible',
    target: 'deep brain structures',
    reason:
      'Scalp electrodes only pick up activity near the surface of the brain, not deep structures.',
    suggestion:
      'Keep the same question but measure a surface signal it predicts, like a difference in an ERP (the brain response right after each picture) or in reaction time.',
  },
  {
    pattern:
      /\b(diagnos\w*|adhd|autis\w*|depress\w*|anxiety disorder|dyslexi\w*|disorder|disease|iq|intelligen\w*|smarter)\b/,
    verdict: 'not-feasible',
    target: 'diagnosis or comparing people',
    reason:
      'A classroom headset and a few participants cannot diagnose anything or rank people; comparing groups needs many people and careful controls.',
    suggestion:
      'Compare two conditions within each participant instead of comparing people, so everyone is their own control.',
  },
  {
    pattern:
      /\b(brain regions?|which part of the brain|lights? up|where in the brain)\b/,
    verdict: 'not-feasible',
    target: 'locating brain regions',
    reason:
      'With 4 to 8 dry electrodes you cannot tell which brain region produced a signal.',
    suggestion:
      'Ask when or how strongly the brain responds (timing and size of the ERP) rather than where.',
  },
  {
    pattern:
      /\b(emotions?|emotional|mood|happy|happiness|sad|sadness|angry|anger|fear|scared|feelings?)\b/,
    verdict: 'stretch',
    target: 'emotions',
    reason:
      'EEG cannot read which emotion someone feels, but emotional pictures do change some brain responses and reaction times.',
    suggestion:
      'Compare emotional versus neutral pictures and look for a difference in the late ERP and in reaction time, rather than naming the emotion.',
  },
  {
    pattern:
      /\b(motor imagery|imagin\w* (moving|movement|squeez\w*)|imagined movement)\b/,
    verdict: 'stretch',
    target: 'motor imagery',
    reason:
      'Imagined movement shows up weakly on consumer headsets and works for only some people.',
    suggestion:
      'Try it on yourself first with many trials; plan to report reaction time too in case the EEG effect is too small.',
  },
  {
    pattern: /\b(n170|faces?)\b/,
    verdict: 'feasible',
    target: 'the N170 face response',
    reason:
      'The face response (N170) is large and shows up well behind the ears, where Muse has electrodes.',
    suggestion:
      'Use pictures that are similar in size and brightness across conditions, so the only real difference is face versus not-face.',
  },
  {
    pattern: /\b(p300|p3|oddball|rare|surpris\w*|unexpected)\b/,
    verdict: 'feasible',
    target: 'the P300 surprise response',
    reason:
      'The P300 is one of the biggest ERPs and works with consumer headsets when the target is rare.',
    suggestion:
      'Make the target condition rare, around 1 in 5 trials, so the P300 is as big as possible.',
  },
  {
    pattern: /\b(alpha|eyes? (closed|shut)|relax\w*|meditat\w*|calm)\b/,
    verdict: 'feasible',
    target: 'alpha waves',
    reason:
      'Alpha waves are strong and easy to see, especially with eyes closed.',
    suggestion:
      'Use long presentation times (several seconds) so there is enough steady EEG to compare between conditions.',
  },
  {
    pattern: /\b(blinks?|blinking|jaw|clench\w*|eye movements?)\b/,
    verdict: 'feasible',
    target: 'blinks and muscle activity',
    reason:
      'Blinks and jaw clenches produce huge, obvious signals on dry electrodes.',
    suggestion:
      'Tell participants exactly when to blink or clench so you can line the signal up with each trial.',
  },
  {
    pattern: /\b(erps?|event[- ]related|brain response)\b/,
    verdict: 'feasible',
    target: 'ERPs',
    reason:
      'Averaging many trials per condition makes ERP differences visible on consumer headsets.',
    suggestion:
      'Aim for at least 50 trials per condition so the average is clean.',
  },
  {
    pattern:
      /\b(reaction times?|response times?|rt|accura\w*|faster|slower|quick\w*|stroop|mistakes?|errors?)\b/,
    verdict: 'feasible',
    target: 'reaction time and accuracy',
    reason:
      'Reaction time and accuracy are very reliable and BrainWaves records them on every trial.',
    suggestion:
      'Keep the EEG on as well: a brain-response difference alongside a reaction-time difference makes a stronger story.',
  },
];

const MOVEMENT =
  /\b(talk\w*|speak\w*|say\w*|out loud|aloud|sing\w*|walk\w*|run(ning)?|exercis\w*|danc\w*|chew\w*|gum|move around)\b/;

/** Clean trials per condition an ERP needs after artifact rejection. */
export const MIN_TRIALS_PER_CONDITION = 50;
const MAX_SESSION_MINUTES = 20;
/** Assumed display time for a self-paced trial, for session-length estimates. */
const SELF_PACED_TRIAL_MS = 1500;

/**
 * The conditions a student has planned (named, or given stimuli) and how many
 * experimental trials each gets. Matches the runtime split in
 * `balanceStimuliByCondition`: every condition gets ceil(nbTrials / n), so this
 * works before any stimulus folder is chosen.
 */
export function plannedConditions(params: ExperimentParameters) {
  const slots = CONDITION_SLOTS.flatMap(({ name }) => {
    const slot = params[name];
    return slot && (slot.title.trim() || slot.dir || slot.audioDir)
      ? [slot.title.trim() || 'Untitled']
      : [];
  });
  const trials = slots.length ? Math.ceil(params.nbTrials / slots.length) : 0;
  return slots.map((title) => ({ title, trials }));
}

export function sessionMinutes(params: ExperimentParameters): number {
  const trialMs =
    (params.selfPaced ? SELF_PACED_TRIAL_MS : (params.presentationTime ?? 0)) +
    params.iti;
  return ((params.nbTrials + (params.nbPracticeTrials ?? 0)) * trialMs) / 60000;
}

export function assessFeasibility(
  params: ExperimentParameters,
  isEEGEnabled: boolean
): FeasibilityAssessment {
  const {
    question = '',
    hypothesis = '',
    methods = '',
  } = params.description ?? {};
  const text = `${question}\n${hypothesis}\n${methods}`.toLowerCase();
  const matches = SIGNAL_RULES.filter((rule) => rule.pattern.test(text));
  const signal =
    matches.find((rule) => rule.verdict === 'not-feasible') ??
    matches.find((rule) => rule.verdict === 'stretch') ??
    matches[0];
  const behaviorOnly =
    !isEEGEnabled || signal?.target === 'reaction time and accuracy';

  const pitfalls: string[] = [];
  const conditions = plannedConditions(params);
  if (!hypothesis.trim()) {
    pitfalls.push(
      'There is no hypothesis yet: write down which condition you expect to differ, and how.'
    );
  }
  if (conditions.length < 2) {
    pitfalls.push('You need at least two conditions to compare.');
  } else if (isEEGEnabled && !behaviorOnly) {
    const fewest = Math.min(...conditions.map((c) => c.trials));
    if (fewest < MIN_TRIALS_PER_CONDITION) {
      pitfalls.push(
        `Only about ${fewest} trials in your smallest condition; ERPs need ${MIN_TRIALS_PER_CONDITION} or more, and 10-30% get thrown out for blinks and movement.`
      );
    }
  }
  const minutes = sessionMinutes(params);
  if (minutes > MAX_SESSION_MINUTES) {
    pitfalls.push(
      `About ${Math.round(minutes)} minutes is long; past ${MAX_SESSION_MINUTES}, participants tire and dry electrodes lose contact.`
    );
  }
  if (isEEGEnabled && MOVEMENT.test(text)) {
    pitfalls.push(
      'Talking, chewing or moving during trials creates muscle signals far bigger than brain signals.'
    );
  }

  if (!signal) {
    return {
      verdict: 'unclear',
      reason:
        'The plan does not yet say what brain signal or behavior should differ between conditions.',
      pitfalls,
      suggestion:
        'Name one specific difference you expect, for example "faces will produce a bigger brain response than houses" or "incongruent words will be slower".',
    };
  }
  return {
    verdict: signal.verdict,
    target: signal.target,
    reason: signal.reason,
    pitfalls,
    suggestion: signal.suggestion,
  };
}
