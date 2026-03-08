import { describe, it, expect } from 'vitest';
import { configuredStore } from '../src/renderer/store';

describe('Redux store', () => {
  it('can be created with initial state', () => {
    const store = configuredStore();
    const state = store.getState();
    expect(state).toHaveProperty('experiment');
    expect(state).toHaveProperty('device');
    expect(state).toHaveProperty('pyodide');
    // router reducer has been removed
    expect(state).not.toHaveProperty('router');
  });
});
