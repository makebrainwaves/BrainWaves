import { describe, it, expect } from 'vitest';
import experimentReducer from '../experimentReducer';

describe('experimentReducer', () => {
  it('defaults isEEGEnabled to true — EEG-on is the app default, opt out for behavior-only', () => {
    const state = experimentReducer(undefined, { type: '@@INIT' });
    expect(state.isEEGEnabled).toBe(true);
  });
});
