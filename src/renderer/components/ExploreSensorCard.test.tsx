import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExploreSensorCard from './ExploreSensorCard';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import { SIGNAL_QUALITY } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';

const channels = ['AF7', 'AF8', 'X1'];
const sample: SignalQualityData = {
  data: [[2, 4], [2, 27], []],
  info: {
    startTime: 0,
    samplingRate: 256,
    channelNames: channels,
    signalQuality: { AF7: 6.2, AF8: 12.3 },
  },
  signalQuality: { AF7: SIGNAL_QUALITY.GREAT, AF8: SIGNAL_QUALITY.OK },
};

function SensorSurface() {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  return (
    <div data-explore-surface>
      <SignalQualityIndicatorComponent
        signalQualityObservable={null}
        plottingInterval={0}
        channels={channels}
        height={140}
        hoveredChannel={hoveredChannel}
        onHoveredChannelChange={setHoveredChannel}
      />
      <ExploreSensorCard
        channels={channels}
        sample={sample}
        hoveredChannel={hoveredChannel}
        onHoveredChannelChange={setHoveredChannel}
      />
    </div>
  );
}

describe('ExploreSensorCard', () => {
  it('cross-highlights keyboard and pointer selections and describes measured variability', () => {
    const { container } = render(<SensorSurface />);
    const row = screen.getByRole('button', { name: 'AF8 · settling' });
    fireEvent.focus(row);
    const tooltip = screen.getByRole('tooltip');
    expect(row.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.textContent).toContain('12.3 µV (standard deviation)');
    const electrode = container.querySelector('[data-electrode="AF8"]')!;
    expect(electrode.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(row, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(electrode.getAttribute('aria-pressed')).toBe('false');

    fireEvent.pointerOver(container.querySelector('[data-electrode="AF7"]')!);
    const firstRow = screen.getByRole('button', { name: 'AF7 · good' });
    expect(firstRow.getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').id
    );
    fireEvent.focus(electrode);
    expect(row.getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').id
    );
  });

  it('opens on a tap, closes outside, and does not invent unknown sensor anatomy or measurements', () => {
    render(<SensorSurface />);
    const unknownRow = screen.getByRole('button', { name: 'X1 · no signal' });
    fireEvent.click(unknownRow);
    expect(screen.getByRole('tooltip').textContent).toContain(
      'scalp position is not in our sensor map'
    );
    expect(screen.getByRole('tooltip').textContent).toContain(
      'waiting for a measurement'
    );
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
