import { describe, expect, it } from 'vitest';
import { progressFromStack } from '../progress';

const trial = (phase?: string) => ({ options: {}, parameters: { phase } });
const loop = (content: unknown[]) => ({
  options: { templateParameters: content.map(() => ({})), content },
});
const sequence = (content: unknown[]) => ({ options: { content } });

describe('progressFromStack', () => {
  it('reports the position in the innermost loop, not an outer block loop', () => {
    const trials = [trial('practice'), trial('practice'), trial('practice')];
    const inner = loop(trials);
    const intro = { options: {} };
    const block = sequence([intro, inner]);
    const blocks = loop([sequence([]), block]);
    const screen = { options: {} };
    expect(
      progressFromStack([blocks, block, inner, trials[1], screen])
    ).toEqual({ phase: 'practice', current: 2, total: 3 });
    // A block's instruction screen is between trials, not "trial 2 of 2".
    expect(progressFromStack([blocks, block, intro])).toBeNull();
  });

  it("treats Stroop's 'task' phase as the recorded main task", () => {
    const trials = [trial('task'), trial('task')];
    expect(progressFromStack([loop(trials), trials[1]])).toMatchObject({
      phase: 'main',
      current: 2,
    });
  });

  it("reads Multitasking's `task: 'training'` as practice", () => {
    const trials = [{ options: {}, parameters: { task: 'training' } }];
    expect(progressFromStack([loop(trials), trials[0]])).toMatchObject({
      phase: 'practice',
    });
  });

  it('is null on screens outside any loop, e.g. instructions', () => {
    const intro = trial();
    const root = sequence([intro]);
    expect(progressFromStack([root, intro])).toBeNull();
  });
});
