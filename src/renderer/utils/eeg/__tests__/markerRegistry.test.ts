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
const stimC = (title: string, type: EVENTS, condition: string): Stimulus => ({
  title,
  type,
  condition,
});

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

  it('uses the experiment condition name as the display label when present', () => {
    const { eventId, codeToLabel } = buildMarkerRegistry([
      stimC('Face1', EVENTS.STIMULUS_1, 'Face'),
      stimC('Face2', EVENTS.STIMULUS_1, 'Face'),
      stimC('House1', EVENTS.STIMULUS_2, 'House'),
    ]);
    // Codes are unchanged (they still drive CSV + MNE); only labels are human.
    expect(eventId).toEqual({ Face: 1, House: 2 });
    expect(codeToLabel).toEqual({ 1: 'Face', 2: 'House' });
  });

  it('falls back to the neutral label if two codes share a condition name', () => {
    const { codeToLabel } = buildMarkerRegistry([
      stimC('A', EVENTS.STIMULUS_1, 'Same'),
      stimC('B', EVENTS.STIMULUS_2, 'Same'),
    ]);
    // Never collapse two codes under one label — the second gets STIMULUS_2.
    expect(codeToLabel[1]).toBe('Same');
    expect(codeToLabel[2]).toBe('STIMULUS_2');
  });

  it('returns empty maps when there are no stimuli', () => {
    expect(buildMarkerRegistry([])).toEqual({ codeToLabel: {}, eventId: {} });
    expect(buildMarkerRegistry()).toEqual({ codeToLabel: {}, eventId: {} });
  });
});
