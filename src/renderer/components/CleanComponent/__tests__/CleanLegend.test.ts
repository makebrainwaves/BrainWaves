/**
 * Clean's code→label legend derives through resolveMarkerRegistry. Imported
 * experiments carry labels (the Markers tab contract), not stimuli — the old
 * buildMarkerRegistry(params.stimuli) bypass left their legend empty while
 * analysis epoched by label.
 */
import { describe, it, expect, vi } from 'vitest';
import { codeToLabelFor } from '../index';
import type { ExperimentParameters } from '../../../constants/interfaces';

vi.mock('../EpochReviewer', () => ({ default: () => null }));
vi.mock('../LiveErpPane', () => ({ default: () => null }));
vi.mock('../CleanSidebar', () => ({ default: () => null }));
vi.mock('lab.js', () => ({}));
vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaceRawEEGData: vi.fn(async () => []),
}));

describe('codeToLabelFor', () => {
  it('reads imported condition labels, not stimuli', () => {
    const params = {
      imported: {
        kind: 'jspsych',
        file: 'task.js',
        conditionKey: 'condition',
        correctKey: 'correct',
        conditionLabels: ['Face', 'House'],
      },
    } as ExperimentParameters;
    expect(codeToLabelFor(params)).toEqual({ 1: 'Face', 2: 'House' });
  });
});
