/**
 * Tests for the marker registry — the single source of truth that keeps the
 * event codes written during collection in lockstep with the event_id map used
 * during MNE analysis. The bug this guards: analysis once keyed event_id by
 * stimulus array index, which didn't match the 1-based codes in the CSV, so
 * epochs were silently dropped.
 */
import { describe, it, expect } from 'vitest';
import { buildMarkerRegistry } from '../markerRegistry';
import { EVENTS } from '../../../constants/constants';
import type { Stimulus } from '../../../constants/interfaces';

const stim = (title: string, type: EVENTS): Stimulus => ({ title, type });

describe('buildMarkerRegistry', () => {
  it('maps event_id values to the numeric codes written to the CSV', () => {
    const { eventId } = buildMarkerRegistry([
      stim('Face1', EVENTS.STIMULUS_1),
      stim('House1', EVENTS.STIMULUS_2),
    ]);
    // VALUES must be the codes find_events() recovers from the Marker column.
    expect(eventId).toEqual({ STIMULUS_1: 1, STIMULUS_2: 2 });
  });

  it('collapses many stimuli sharing a code into one condition entry', () => {
    const { eventId, codeToLabel } = buildMarkerRegistry([
      stim('Face1', EVENTS.STIMULUS_1),
      stim('Face2', EVENTS.STIMULUS_1),
      stim('Face3', EVENTS.STIMULUS_1),
      stim('House1', EVENTS.STIMULUS_2),
    ]);
    expect(eventId).toEqual({ STIMULUS_1: 1, STIMULUS_2: 2 });
    expect(codeToLabel).toEqual({ 1: 'STIMULUS_1', 2: 'STIMULUS_2' });
  });

  it('produces a round-trippable code<->label pair', () => {
    const { eventId, codeToLabel } = buildMarkerRegistry([
      stim('A', EVENTS.STIMULUS_1),
      stim('B', EVENTS.STIMULUS_2),
    ]);
    for (const [label, code] of Object.entries(eventId)) {
      expect(codeToLabel[code]).toBe(label);
    }
  });

  it('returns empty maps when there are no stimuli', () => {
    expect(buildMarkerRegistry([])).toEqual({ codeToLabel: {}, eventId: {} });
    expect(buildMarkerRegistry()).toEqual({ codeToLabel: {}, eventId: {} });
  });
});
