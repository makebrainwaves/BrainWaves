/** One phase of a task's timeline, as shown in the protocol diagram. */
export interface FlowPhase {
  label: string;
  /** Omit for a phase with no fixed count (e.g. instructions). */
  count?: number;
}

/** A task's real loop structure. Multitasking uses `blocks`. */
export interface LoopStructure {
  /** Trials the participant practices before the recorded task. */
  practice?: number;
  /** Trials recorded for analysis. */
  recorded?: number;
  /** Block-structured tasks (Multitasking) instead of practice/recorded. */
  blocks?: Array<{ label: string; practice?: number; recorded?: number }>;
}

/**
 * Builds the vertical timeline from a task's real loop structure. Never reads
 * `params.nbTrials`, which is stale for Stroop and Search. Block tasks list
 * their blocks without a study-wide trial total.
 */
export function flowFromStructure(structure: LoopStructure): FlowPhase[] {
  const blocks = structure.blocks ?? [
    { label: 'Practice trials', practice: structure.practice },
    { label: 'Recorded trials', recorded: structure.recorded },
  ];
  return [
    { label: 'Instructions' },
    ...blocks.flatMap(({ label, practice }) =>
      practice ? [{ label, count: practice }] : []
    ),
    { label: 'Main-task reminder' },
    ...blocks.flatMap(({ label, recorded }) =>
      recorded ? [{ label, count: recorded }] : []
    ),
    { label: 'Completion' },
  ];
}
