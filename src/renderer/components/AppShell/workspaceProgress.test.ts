import { describe, it, expect } from 'vitest';
import { summarize } from './useWorkspaceProgress';

describe('summarize', () => {
  it('recommends collect and shows no badges on an empty workspace', () => {
    expect(summarize({ raw: 0, cleaned: 0, behavior: 0 }, 'eeg')).toEqual({
      badges: {},
      next: 'collect',
      counts: { raw: 0, cleaned: 0, behavior: 0 },
    });
  });

  it('recommends clean when EEG is recorded but not cleaned', () => {
    expect(summarize({ raw: 4, cleaned: 0, behavior: 4 }, 'eeg')).toEqual({
      badges: { collect: ['4 recordings'] },
      next: 'clean',
      counts: { raw: 4, cleaned: 0, behavior: 4 },
    });
  });

  it('recommends analyze with both badges once cleaned', () => {
    expect(summarize({ raw: 4, cleaned: 3, behavior: 0 }, 'eeg')).toEqual({
      badges: { collect: ['4 recordings'], clean: ['3 cleaned'] },
      next: 'analyze',
      counts: { raw: 4, cleaned: 3, behavior: 0 },
    });
  });

  it('never recommends clean for behavior-only workspaces', () => {
    expect(summarize({ raw: 0, cleaned: 0, behavior: 1 }, 'behavior')).toEqual({
      badges: { collect: ['1 recording'] },
      next: 'analyze',
      counts: { raw: 0, cleaned: 0, behavior: 1 },
    });
  });

  it('passes counts through unchanged so area gates can read them', () => {
    const counts = { raw: 2, cleaned: 1, behavior: 3 };
    expect(summarize(counts, 'eeg').counts).toEqual(counts);
    expect(summarize(counts, 'behavior').counts).toEqual(counts);
  });
});
