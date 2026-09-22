# Domain model

Terms naming good seams. Keep entries short; add one when a conversation sharpens it.

---

## Marker code contract

Numeric codes in the CSV `Marker` column are 1-based `stimulus.type` values and must equal the analysis `event_id` values (MNE `find_events`). Broken twice historically: index-based event maps, and per-hook hand-rolled ternaries that contradict their own params declaration.

## Marker util (`src/renderer/utils/eeg/markerRegistry.ts`)

Shared marker features: code ↔ label maps, label → code at emission, one clock domain, fan-out to both sinks (driver `injectMarker`, LSL `sendMarker`). Deliberately NOT a standalone Marker module: per-experiment condition mapping stays in the experiments (see Condition label); only the shared features centralize here.

## Marker timing rule

A marker is `{code, timestamp}` buffered until the sample whose interval contains the timestamp arrives, then attached to that one sample — error bounded to one sample. Adopted in the marker-timestamp PR as the single semantics forward; every adapter conforms via one shared stamping helper, and the emit helper owns the clock so adapters and sinks agree.

## Condition label

The experiment-defined name of a trial condition ('Switching', 'congruent', imported `conditionLabels`). Mapping trial parameters → label is experiment-dependent and lives in each experiment's hooks. Hooks emit labels, never numbers.

## Experiment pack

params + content + lab.js/jsPsych hooks for one experiment type (`getExperimentFromType`).

## EEGDriver

Device adapter seam (`src/renderer/utils/eeg/types.ts`): connect, createRawObservable, injectMarker. LSL inlet recording is intentionally outside it (an external recorder owns markers there).
