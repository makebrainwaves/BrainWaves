import { describe, expect, it } from 'vitest';
import { ExperimentActions } from '../../actions';
import experimentReducer, { ExperimentStateType } from '../experimentReducer';

const initial = experimentReducer(undefined, { type: '@@INIT' });
const apply = (...actions: Parameters<typeof experimentReducer>[1][]) =>
  actions.reduce(experimentReducer, initial);

describe('experimentReducer run lifecycle', () => {
  it('a run that finishes as it is ended early is recorded as complete', () => {
    const state = apply(
      ExperimentActions.SetIsRunning(true),
      ExperimentActions.Stop({ data: 'full', outcome: 'complete' }),
      ExperimentActions.EndRun(),
      ExperimentActions.Stop({ data: '', outcome: 'incomplete' }),
      ExperimentActions.SetIsRunning(false)
    );

    expect(state.runOutcome).toBe('complete');
    expect(state.isEnding).toBe(false);
  });

  it('ending early only applies to a live run', () => {
    expect(apply(ExperimentActions.EndRun()).isEnding).toBe(false);
    expect(
      apply(ExperimentActions.SetIsRunning(true), ExperimentActions.EndRun())
        .isEnding
    ).toBe(true);
  });

  it('the next run clears the last result', () => {
    const state = apply(
      ExperimentActions.SetIsRunning(true),
      ExperimentActions.Stop({ data: '', outcome: 'incomplete' }),
      ExperimentActions.SetIsRunning(false),
      ExperimentActions.SetIsRunning(true)
    );

    expect(state.runOutcome).toBeNull();
  });

  it('reopening a workspace never restores a live run', () => {
    const saved = {
      ...initial,
      isEnding: true,
      escapeHeld: true,
      runOutcome: 'complete',
    } as ExperimentStateType;

    const state = apply(ExperimentActions.SetState(saved));

    expect(state.runOutcome).toBeNull();
    expect(state.isEnding).toBe(false);
    expect(state.escapeHeld).toBe(false);
  });
});
