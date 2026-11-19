import { configureStore } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import rootReducer, { RootState } from '../../reducers';
import { PyodideActions, PyodideActionType } from '../../actions';
import pyodideEpics from '../pyodideEpics';

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const svg = { 'image/svg+xml': '<svg>previous selection</svg>' };

/** A store running the real pyodide epics against a fake worker. */
function analyzeWithPreviousResults() {
  const epicMiddleware = createEpicMiddleware<
    PyodideActionType,
    PyodideActionType,
    RootState
  >();
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(epicMiddleware),
  });
  epicMiddleware.run(pyodideEpics);
  // The epics only listen for 'message'/'error' events, which EventTarget has.
  const worker = new EventTarget() as unknown as Worker;
  store.dispatch(PyodideActions.SetPyodideWorker(worker));
  store.dispatch(PyodideActions.SetPSDPlot(svg));
  store.dispatch(PyodideActions.SetTopoPlot(svg));
  store.dispatch(PyodideActions.SetERPPlot(svg));
  store.dispatch(PyodideActions.SetEpochInfo([{ name: 'Face', value: 61 }]));
  store.dispatch(PyodideActions.SetChannelInfo(['TP9', 'AF7']));
  store.dispatch(
    PyodideActions.SetCleanedEpochArrays({
      buffer: new ArrayBuffer(0),
      meta: {
        n_epochs: 0,
        n_channels: 0,
        n_times: 0,
        ch_names: [],
        times: [],
        event_codes: [],
      },
    })
  );
  const reply = (data: Record<string, unknown>) =>
    worker.dispatchEvent(new MessageEvent('message', { data }));
  return { store, reply };
}

describe('pyodideMessageEpic: Analyze load replies', () => {
  beforeEach(() => vi.mocked(toast.error).mockClear());

  it('a failed load clears the previous results and puts Analyze in its error state', () => {
    const { store, reply } = analyzeWithPreviousResults();

    reply({ error: 'ValueError: bads must match', dataKey: 'cleanedEpochs' });

    const { pyodide } = store.getState();
    expect(pyodide.psdPlot).toBeNull();
    expect(pyodide.topoPlot).toBeNull();
    expect(pyodide.erpPlot).toBeNull();
    expect(pyodide.epochsInfo).toEqual([]);
    expect(pyodide.channelInfo).toEqual([]);
    expect(pyodide.cleanedEpochArrays).toBeNull();
    expect(pyodide.failedPlots).toContain('load');
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('requests queued behind a failed load fail quietly into the error state', () => {
    const { store, reply } = analyzeWithPreviousResults();
    reply({ error: 'ValueError', dataKey: 'cleanedEpochs' });

    reply({ error: "AttributeError: 'NoneType'", dataKey: 'epochsInfo' });
    reply({ error: "AttributeError: 'NoneType'", plotKey: 'topo' });
    reply({ error: "AttributeError: 'NoneType'", plotKey: 'psd' });

    const { pyodide } = store.getState();
    expect(pyodide.psdPlot).toBeNull();
    expect(pyodide.failedPlots).toEqual(
      expect.arrayContaining(['load', 'topo', 'psd'])
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('a newer selection that loads leaves the error state, even when the older failure lands after it was picked', () => {
    const { store, reply } = analyzeWithPreviousResults();

    store.dispatch(PyodideActions.LoadCleanedEpochs([]));
    reply({ error: 'ValueError', dataKey: 'cleanedEpochs' });
    reply({ dataKey: 'cleanedEpochs' });
    reply({ error: 'plot failed', plotKey: 'psd' });

    expect(store.getState().pyodide.failedPlots).toEqual(['psd']);
    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
