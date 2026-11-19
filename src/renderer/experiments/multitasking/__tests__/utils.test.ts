import { describe, expect, it, vi } from 'vitest';
import { scoreTaskResponse } from '../utils';

vi.mock('lab.js', () => ({}));

/** A loop-cloned Stimulus screen: `this.id` is set, `this.options.id` is not. */
const stimulus = (
  parameters: Record<string, unknown>,
  data: Record<string, unknown>
) => ({
  id: '0_2_0_3_0_4_1',
  options: {},
  parameters: { cond: 'Switching', cor_response: 'b', ...parameters },
  data,
});

describe('scoreTaskResponse', () => {
  it('scores a main trial from the stimulus screen itself', () => {
    const screen = stimulus(
      { task: 'main' },
      { response: 'n', duration: 812.5 }
    );
    scoreTaskResponse.call(screen as never);
    expect(screen.data).toMatchObject({
      trial_number: 5,
      condition: 'Switching',
      reaction_time: 812.5,
      correct_response: false,
      response_given: 'yes',
    });
    expect(screen.data).not.toHaveProperty('phase', 'practice');
  });

  it('marks a timed-out trial as no response and training as practice', () => {
    const screen = stimulus({ task: 'training' }, { duration: 5000 });
    scoreTaskResponse.call(screen as never);
    expect(screen.data).toMatchObject({
      response_given: 'no',
      correct_response: false,
      phase: 'practice',
    });
  });
});
