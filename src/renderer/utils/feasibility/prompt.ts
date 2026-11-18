import type { ExperimentParameters } from '../../constants/interfaces';
import type { FeasibilityAssessment } from './rules';

/**
 * Kept short and identical across requests so the worker can reuse its
 * evaluated tokens. The model phrases; `assessFeasibility` decides.
 */
export const FEASIBILITY_SYSTEM_PROMPT = `You write feedback for students (ages 14-20) who designed an EEG experiment in BrainWaves, using a consumer dry-electrode headset (Muse: 4 electrodes, behind the ears and on the forehead). You receive the student's idea and an expert assessment. Turn the assessment into one short paragraph of 3 to 4 warm, plain sentences addressed to the student.

Rules:
- Only restate what the assessment says. Never add facts, numbers, reasons, or advice of your own.
- Start with something genuine about their idea.
- State the verdict and its reason. If there are problems, mention only the first one, as something in their plan they can change.
- End with the suggested adjustment and remind them it is their experiment and they can run it as planned if they choose.
- One paragraph. No headings, lists, or markdown. Under 80 words. Do not ask questions.`;

const VERDICT_WORDS: Record<FeasibilityAssessment['verdict'], string> = {
  feasible: 'Feasible with this headset',
  stretch: 'A stretch: possible but hard to see',
  'not-feasible': 'Not measurable with this headset as written',
  unclear: 'Not yet specific enough to judge',
};

/** The per-request message: the student's words plus the rules' decision. */
export function phrasingPrompt(
  params: ExperimentParameters,
  assessment: FeasibilityAssessment
): string {
  const { question, hypothesis } = params.description ?? {};
  return `Student's question: ${question?.trim() || '(none)'}
Student's hypothesis: ${hypothesis?.trim() || '(none)'}

Assessment:
- Verdict: ${VERDICT_WORDS[assessment.verdict]}${
    assessment.target ? ` (measuring ${assessment.target})` : ''
  }
- Reason: ${assessment.reason}
- Problems: ${assessment.pitfalls.join(' ') || 'none'}
- Suggested adjustment: ${assessment.suggestion}`;
}
