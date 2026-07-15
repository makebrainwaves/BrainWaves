/**
 * Single source of truth mapping experiment stimulus event codes <-> labels.
 *
 * THE CONTRACT THIS ENFORCES
 * --------------------------
 * Collection writes a numeric event code into the CSV `Marker` column — the
 * code is `stimulus.type` (an EVENTS enum value, e.g. STIMULUS_1 = 1). Analysis
 * (MNE) recovers events from that column via find_events() and filters them
 * with an `event_id` map whose VALUES must equal the codes in the data.
 *
 * Before this registry existed, analysis built event_id from the stimulus
 * ARRAY INDEX ({title: 0}, {title: 1}, ...), which did not match the 1-based
 * codes in the CSV — so events coded `2` matched no event_id entry and those
 * epochs were silently dropped. Deriving both ends from this one function keeps
 * the collection code and the analysis code in lockstep.
 *
 *     stimulus.type (number) ──> CSV Marker column ──┐
 *                                                    ├─> must agree
 *     buildMarkerRegistry().eventId (label->code) ───┘   (find_events / Epochs)
 */
import { EVENTS } from '../../constants/constants';
import { Stimulus } from '../../constants/interfaces';

// Canonical numeric-code -> label lookup. The EVENTS enum has intentional
// aliases (TARGET = 2, NONTARGET = 1); we use the condition-neutral STIMULUS_n
// name as the canonical label so the mapping is stable across experiments.
const CODE_TO_LABEL: Record<number, string> = {
  [EVENTS.STIMULUS_1]: 'STIMULUS_1',
  [EVENTS.STIMULUS_2]: 'STIMULUS_2',
  [EVENTS.STIMULUS_3]: 'STIMULUS_3',
  [EVENTS.STIMULUS_4]: 'STIMULUS_4',
};

export interface MarkerRegistry {
  /** Numeric code (as written to the CSV Marker column) -> human-readable label. */
  codeToLabel: Record<number, string>;
  /** Label -> code: the event_id map MNE's find_events()/Epochs() consume. */
  eventId: Record<string, number>;
}

/**
 * Build the registry for an experiment from the distinct numeric event codes
 * present in its stimuli. Multiple stimuli may share a code (e.g. every "Face"
 * image is STIMULUS_1) — they collapse to one condition entry, which is exactly
 * what MNE wants.
 *
 * The display label prefers the experiment's own condition name
 * (`stimulus.condition`, e.g. "Face"/"House") so the Clean counts, legend, and
 * ERP read the real conditions instead of the generic STIMULUS_n. It falls back
 * to the neutral STIMULUS_n label, then `EVENT_<n>`, so nothing is silently
 * lost. Labels are display-only — the numeric codes still drive the CSV and
 * MNE's event_id (eventId VALUES are the codes). A condition name is only used
 * if it's unique across codes; two codes are never collapsed under one label
 * (that would silently merge conditions in analysis).
 */
export const buildMarkerRegistry = (
  stimuli: Stimulus[] = []
): MarkerRegistry => {
  // First distinct condition name seen for each code (codes may repeat across
  // many stimuli that all share the same condition).
  const conditionForCode = new Map<number, string>();
  for (const stimulus of stimuli) {
    if (typeof stimulus.type !== 'number') continue;
    if (!conditionForCode.has(stimulus.type) && stimulus.condition) {
      conditionForCode.set(stimulus.type, stimulus.condition);
    } else if (!conditionForCode.has(stimulus.type)) {
      conditionForCode.set(stimulus.type, '');
    }
  }

  const codeToLabel: Record<number, string> = {};
  const eventId: Record<string, number> = {};
  const usedLabels = new Set<string>();
  for (const [code, condition] of conditionForCode) {
    const neutral = CODE_TO_LABEL[code] ?? `EVENT_${code}`;
    // Use the condition name only if it's non-empty and not already claimed by
    // another code; otherwise fall back to the guaranteed-unique neutral label.
    const label =
      condition && !usedLabels.has(condition) ? condition : neutral;
    usedLabels.add(label);
    codeToLabel[code] = label;
    eventId[label] = code;
  }
  return { codeToLabel, eventId };
};
