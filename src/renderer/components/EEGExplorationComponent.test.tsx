import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import EEGExplorationComponent from './EEGExplorationComponent';
import { DeviceActions } from '../actions';
import {
  CONNECTION_STATUS,
  MUSE_CHANNELS,
  SIGNAL_QUALITY,
} from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';

const chunk: SignalQualityData = {
  data: MUSE_CHANNELS.map(() => new Array(64).fill(0)),
  info: {
    startTime: 1000,
    samplingRate: 256,
    channelNames: MUSE_CHANNELS,
    signalQuality: Object.fromEntries(MUSE_CHANNELS.map((c) => [c, 1])),
  },
  signalQuality: Object.fromEntries(
    MUSE_CHANNELS.map((c) => [c, SIGNAL_QUALITY.GREAT])
  ),
};

beforeEach(() => {
  window.electronAPI = {
    ...window.electronAPI,
    getViewerUrl: async () => 'http://viewer.local/',
  };
});

describe('EEGExplorationComponent', () => {
  it('shows the stream-stopped banner when the stream ends during a lesson', async () => {
    const stream = new Subject<SignalQualityData>();
    render(
      <EEGExplorationComponent
        connectedDevice={{
          name: 'Muse-1A2B',
          samplingRate: 256,
          channels: MUSE_CHANNELS,
        }}
        signalQualityObservable={stream}
        connectionStatus={CONNECTION_STATUS.CONNECTED}
        DeviceActions={
          { DisconnectFromDevice: vi.fn() } as unknown as typeof DeviceActions
        }
      />
    );
    act(() => stream.next(chunk));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Start How do I get a cleaner signal?',
      })
    );
    expect(screen.getByText(/Tip 1 of 3/i)).toBeVisible();

    act(() => stream.complete());

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The signal stream stopped.');
    expect(
      screen.getByRole('button', { name: 'Reconnect headset' })
    ).toBeVisible();
    expect(screen.getByText(/Tip 1 of 3/i)).toBeVisible();
    await act(async () => {});
  });
});
