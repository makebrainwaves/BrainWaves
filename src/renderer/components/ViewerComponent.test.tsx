import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Observable, Subject } from 'rxjs';
import ViewerComponent from './ViewerComponent';
import { SignalQualityData } from '../constants/interfaces';
import { SIGNAL_QUALITY } from '../constants/constants';
import type { EEGSnapshot } from '../../shared/eegVizTypes';

const chunk: SignalQualityData = {
  data: [[0, 1]],
  info: {
    startTime: 1000,
    samplingRate: 256,
    channelNames: ['AF7'],
    signalQuality: { AF7: 1 },
  },
  signalQuality: { AF7: SIGNAL_QUALITY.GREAT },
};

const snapshot: EEGSnapshot = {
  data: [[0, 1, 0, -1, 0]],
  channels: ['AF7'],
  samplingRate: 1,
  startTime: 1000,
  endTime: 6000,
  peakToPeak: 2,
};

async function readyWebviews(container: HTMLElement) {
  await act(async () => {});
  return Array.from(container.querySelectorAll('webview')).map((element) => {
    const send = vi.fn();
    Object.assign(element, { send });
    return { element, send };
  });
}

beforeEach(() => {
  window.electronAPI = {
    ...window.electronAPI,
    getViewerUrl: async () => 'http://viewer.local/',
  };
});

describe('ViewerComponent', () => {
  it('keeps two guests independent and waits for each guest before streaming', async () => {
    const first = new Subject<SignalQualityData>();
    const second = new Subject<SignalQualityData>();
    const { container, unmount } = render(
      <>
        <ViewerComponent
          plottingInterval={250}
          signalQualityObservable={first}
        />
        <ViewerComponent
          plottingInterval={250}
          signalQualityObservable={second}
        />
      </>
    );
    const [a, b] = await readyWebviews(container);
    act(() => {
      first.next(chunk);
      second.next(chunk);
    });
    expect(a.send).not.toHaveBeenCalled();
    expect(b.send).not.toHaveBeenCalled();

    act(() => a.element.dispatchEvent(new Event('dom-ready')));
    act(() => {
      first.next(chunk);
      second.next(chunk);
    });
    expect(a.send).toHaveBeenCalledWith('newData', chunk);
    expect(b.send).not.toHaveBeenCalled();

    act(() => b.element.dispatchEvent(new Event('dom-ready')));
    a.send.mockClear();
    act(() => second.next(chunk));
    expect(a.send).not.toHaveBeenCalled();
    expect(b.send).toHaveBeenCalledWith('newData', chunk);

    unmount();
    a.send.mockClear();
    b.send.mockClear();
    act(() => {
      first.next(chunk);
      second.next(chunk);
      a.element.dispatchEvent(new Event('dom-ready'));
    });
    expect(a.send).not.toHaveBeenCalled();
    expect(b.send).not.toHaveBeenCalled();
  });

  it('does not subscribe for a snapshot and resumes once when returning to live', async () => {
    let subscriptions = 0;
    let activeSubscriptions = 0;
    const source = new Observable<SignalQualityData>((subscriber) => {
      subscriptions += 1;
      activeSubscriptions += 1;
      subscriber.next(chunk);
      return () => {
        activeSubscriptions -= 1;
      };
    });
    const { container, rerender, unmount } = render(
      <ViewerComponent
        plottingInterval={250}
        signalQualityObservable={source}
        snapshot={snapshot}
        amplitudeScale={100}
      />
    );
    const [guest] = await readyWebviews(container);
    act(() => guest.element.dispatchEvent(new Event('dom-ready')));
    expect(subscriptions).toBe(0);

    rerender(
      <ViewerComponent
        plottingInterval={250}
        signalQualityObservable={source}
      />
    );
    expect(subscriptions).toBe(1);
    expect(activeSubscriptions).toBe(1);
    rerender(
      <ViewerComponent
        plottingInterval={250}
        signalQualityObservable={source}
        annotations={[]}
      />
    );
    expect(subscriptions).toBe(1);
    unmount();
    expect(activeSubscriptions).toBe(0);
  });

  it('forwards navigation keys from a focused webview only when non-editable', async () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <ViewerComponent
        plottingInterval={250}
        signalQualityObservable={null}
        onNavigate={onNavigate}
      />
    );
    const [guest] = await readyWebviews(container);
    act(() => guest.element.dispatchEvent(new Event('dom-ready')));
    const message = (channel: string, type: string) =>
      Object.assign(new Event('ipc-message'), { channel, args: [{ type }] });
    act(() => guest.element.dispatchEvent(message('viewer:navigate', 'left')));
    expect(onNavigate).toHaveBeenCalledWith('left');
    act(() => guest.element.dispatchEvent(message('viewer:navigate', 'right')));
    expect(onNavigate).toHaveBeenLastCalledWith('right');
    act(() =>
      guest.element.dispatchEvent(message('viewer:navigate', 'escape'))
    );
    expect(onNavigate).toHaveBeenLastCalledWith('escape');
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });
});
