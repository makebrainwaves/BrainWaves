import React from 'react';
import { Subject } from 'rxjs';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LiveSignalPrep from '../LiveSignalPrep';
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
    expect(screen.getByRole('status')).toHaveTextContent(/still settling/);
  });
});
