import React from 'react';
import { cn } from '../ui/utils';
import { DeviceState } from './types';

const GLYPH: Record<DeviceState, string> = {
  none: 'rounded-full border-2 border-[#8d8d8d]',
  connected: 'rounded-full bg-brand',
  fixture: 'rounded-[2px] border-[1.5px] border-dashed border-ink-muted',
};

/**
 * Factual headset status: glyph shape + text, never color alone. Says nothing
 * about recording — that is the RunBar's job.
 */
export default function DeviceChip({
  device,
  deviceName = 'Headset',
  onClick,
}: {
  device: DeviceState;
  /** Shown when connected, e.g. `Muse 2`. */
  deviceName?: string;
  /** Opens headset setup. Omitted during a run, where the chip is status only. */
  onClick?(): void;
}) {
  const [label, aria] = {
    none: ['No headset', 'Device: no headset connected'],
    connected: [
      `${deviceName} · Connected`,
      `Device: ${deviceName} connected, not recording`,
    ],
    fixture: ['Fixture', 'Device: fixture data, no headset'],
  }[device];
  const className =
    'flex h-[32px] items-center gap-[8px] whitespace-nowrap rounded-full border border-[#e0e0e0] bg-white px-[12px] text-[13px] text-ink';
  const content = (
    <>
      <span aria-hidden className={`h-[10px] w-[10px] ${GLYPH[device]}`} />
      <span>{label}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      aria-label={`${aria}. Open headset setup`}
      onClick={onClick}
      className={cn(
        className,
        'cursor-pointer hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
      )}
    >
      {content}
    </button>
  ) : (
    <div role="status" aria-label={aria} className={className}>
      {content}
    </div>
  );
}
