import { describe, expect, it } from 'vitest';
import { CONDITION_PALETTE_RGB, cssColorForIndex } from '../conditionPalette';

describe('CONDITION_PALETTE_RGB', () => {
  it('uses blue then orange as the first two condition colors', () => {
    const [blue, orange] = CONDITION_PALETTE_RGB;
    // Blue: R low, B high. Orange: R high, G mid, B low.
    expect(blue[2]).toBeGreaterThan(blue[0]);
    expect(blue[2]).toBeGreaterThan(blue[1]);
    expect(orange[0]).toBeGreaterThan(orange[2]);
    expect(orange[1]).toBeGreaterThan(orange[2]);
    expect(cssColorForIndex(0)).toMatch(/^rgb\(/);
    expect(cssColorForIndex(1)).toMatch(/^rgb\(/);
  });
});
