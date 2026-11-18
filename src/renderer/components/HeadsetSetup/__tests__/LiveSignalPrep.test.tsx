import React from 'react';
import { Subject } from 'rxjs';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LiveSignalPrep, { SIGNAL_STALL_MS } from '../LiveSignalPrep';
import { DEVICES, SIGNAL_QUALITY } from '../../../constants/constants';
import { SignalQualityData } from '../../../constants/interfaces';
import { qualitySample } from '../../Explore/fixtures';

describe('LiveSignalPrep', () => {
  it('opens Continue on the first quality sample, whatever its quality', () => {
    const stream = new Subject<SignalQualityData>();
    render(
      <LiveSignalPrep
        device={DEVICES.MUSE}
        observable={stream}
        channels={['TP9', 'AF7']}
        onContinue={vi.fn()}
      />
    );
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont).toBeDisabled();

    act(() =>
      stream.next(
        qualitySample([
          { channel: 'TP9', quality: SIGNAL_QUALITY.BAD },
          { channel: 'AF7', quality: SIGNAL_QUALITY.OK },
        ])
      )
    );
    expect(cont).toBeEnabled();
    // The head map keeps the reading across the re-render it caused.
    const fill = (channel: string) =>
      document.querySelector<SVGCircleElement>(
        `[data-electrode="${channel}"] circle`
      )?.style.fill;
    expect(fill('TP9')).toBe(SIGNAL_QUALITY.BAD);
    expect(fill('AF7')).toBe(SIGNAL_QUALITY.OK);
    expect(screen.getByRole('status')).toHaveTextContent(/still settling/);
  });

  it('opens Continue with a headset check when no sample ever arrives', () => {
    vi.useFakeTimers();
    render(
      <LiveSignalPrep
        device={DEVICES.MUSE}
        observable={new Subject<SignalQualityData>()}
        channels={['TP9']}
        onContinue={vi.fn()}
      />
    );
    const cont = screen.getByRole('button', { name: 'Continue' });
    act(() => {
      vi.advanceTimersByTime(SIGNAL_STALL_MS - 1);
    });
    expect(cont).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cont).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent(/No signal yet/);
    vi.useRealTimers();
  });
});
