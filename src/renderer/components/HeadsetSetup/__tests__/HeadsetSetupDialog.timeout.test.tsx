import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import rootReducer from '../../../reducers';
import deviceEpics from '../../../epics/deviceEpics';
import type { DeviceActionType } from '../../../actions';
import type { RootState } from '../../../reducers';
import { SEARCH_TIMEOUT_MS } from '../../../constants/constants';
import HeadsetSetupDialog from '../HeadsetSetupDialog';

const driver = vi.hoisted(() => ({
  scan: vi.fn(),
  cancelScan: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  disconnect$: vi.fn(),
}));
vi.mock('../../../utils/eeg', () => ({
  getDriver: () => driver,
  setActiveDriver: vi.fn(),
}));
vi.mock('../../../utils/eeg/muse', () => ({
  createMuseSignalQualityObservable: vi.fn(),
}));
vi.mock('../../../utils/eeg/lslInlet', () => ({}));
vi.mock('../../../utils/eeg/lslBridge', () => ({}));

/** Real reducers + device epics, so the whole search → time limit → screen chain runs. */
function renderWithStore() {
  const epicMiddleware = createEpicMiddleware<
    DeviceActionType,
    DeviceActionType,
    RootState
  >();
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(epicMiddleware),
  });
  epicMiddleware.run(deviceEpics);
  render(
    <Provider store={store}>
      <HeadsetSetupDialog open onClose={vi.fn()} onDone={vi.fn()} />
    </Provider>
  );
}

describe('HeadsetSetupDialog search time limit', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows "couldn\u2019t find" with the power-on question once a silent search runs out, and can search again', async () => {
    vi.useFakeTimers();
    driver.scan.mockReturnValue(new Promise(() => undefined));
    renderWithStore();

    fireEvent.click(screen.getByRole('button', { name: 'Muse' }));
    fireEvent.click(screen.getByRole('button', { name: 'It’s on' }));
    fireEvent.click(screen.getByRole('button', { name: 'Find my headset' }));
    expect(screen.getByText(/Looking for your Muse/)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS - 1));
    expect(screen.getByText(/Looking for your Muse/)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByText('We couldn’t find your Muse')).toBeInTheDocument();
    expect(screen.getByText('Is your Muse turned on?')).toBeInTheDocument();
    expect(
      screen.getByText(/Moving lights mean it is waiting to pair/)
    ).toBeInTheDocument();
    expect(driver.cancelScan).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Search again' }));
    expect(screen.getByText(/Looking for your Muse/)).toBeInTheDocument();
    expect(driver.scan).toHaveBeenCalledTimes(2);
  });
});
