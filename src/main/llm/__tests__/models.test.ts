import { describe, expect, it } from 'vitest';
import { LLM_MODEL_TIERS, pickModelFile } from '../models';

const GiB = 1024 ** 3;
const [large, small] = LLM_MODEL_TIERS.map((tier) => tier.file);

describe('pickModelFile', () => {
  it('prefers the larger model when RAM allows', () => {
    expect(pickModelFile(new Set([small, large]), 8 * GiB)).toBe(large);
  });

  it('falls back to the small model on a 4 GB machine even if the large one is installed', () => {
    expect(pickModelFile(new Set([small, large]), 4 * GiB)).toBe(small);
  });

  it('refuses a model the machine cannot hold', () => {
    expect(pickModelFile(new Set([large]), 4 * GiB)).toBeUndefined();
    expect(pickModelFile(new Set([small]), 2 * GiB)).toBeUndefined();
  });

  it('ignores unrelated files and half-finished downloads', () => {
    expect(
      pickModelFile(new Set([`${large}.part`, 'notes.txt']), 32 * GiB)
    ).toBeUndefined();
  });
});
