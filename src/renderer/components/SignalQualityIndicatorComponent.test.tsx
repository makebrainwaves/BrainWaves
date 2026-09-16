import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Subject } from 'rxjs';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import { SignalQualityData } from '../constants/interfaces';
import { SIGNAL_QUALITY } from '../constants/constants';

describe('SignalQualityIndicatorComponent', () => {
  it('replaces the stream subscription and releases it on unmount', () => {
    const first = new Subject<SignalQualityData>();
    const second = new Subject<SignalQualityData>();
    const { rerender, unmount } = render(
      <SignalQualityIndicatorComponent
        signalQualityObservable={first}
        plottingInterval={500}
      />
    );
    expect(first.observed).toBe(true);
    rerender(
      <SignalQualityIndicatorComponent
        signalQualityObservable={second}
        plottingInterval={500}
      />
    );
    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
    unmount();
    expect(second.observed).toBe(false);
  });

  it('keeps two head diagrams independent and hides stale channels after a montage change', () => {
    const first = new Subject<SignalQualityData>();
    const second = new Subject<SignalQualityData>();
    const { container } = render(
      <>
        <SignalQualityIndicatorComponent
          signalQualityObservable={first}
          plottingInterval={0}
          height={140}
        />
        <SignalQualityIndicatorComponent
          signalQualityObservable={second}
          plottingInterval={0}
          height={250}
        />
      </>
    );
    const heads = container.querySelectorAll('[data-explore-head]');
    const firstAF7 = heads[0].querySelector('[data-electrode="AF7"]')!;
    const secondAF7 = heads[1].querySelector('[data-electrode="AF7"]')!;
    act(() => {
      first.next({
        data: [[1, 2]],
        info: {
          startTime: 0,
          samplingRate: 256,
          channelNames: ['AF7'],
          signalQuality: { AF7: 6 },
        },
        signalQuality: { AF7: SIGNAL_QUALITY.GREAT },
      });
      second.next({
        data: [[1, 30]],
        info: {
          startTime: 0,
          samplingRate: 256,
          channelNames: ['AF7'],
          signalQuality: { AF7: 18 },
        },
        signalQuality: { AF7: SIGNAL_QUALITY.BAD },
      });
    });
    expect(firstAF7.querySelector('circle')!.style.fill).toBe(
      SIGNAL_QUALITY.GREAT
    );
    expect(secondAF7.querySelector('circle')!.style.fill).toBe(
      SIGNAL_QUALITY.BAD
    );
    expect(firstAF7.getAttribute('visibility')).toBe('visible');
    act(() =>
      first.next({
        data: [[1, 2]],
        info: {
          startTime: 10,
          samplingRate: 256,
          channelNames: ['TP9'],
          signalQuality: { TP9: 6 },
        },
        signalQuality: { TP9: SIGNAL_QUALITY.GREAT },
      })
    );
    expect(firstAF7.getAttribute('visibility')).toBe('hidden');
    expect(secondAF7.getAttribute('visibility')).toBe('visible');
  });
});
