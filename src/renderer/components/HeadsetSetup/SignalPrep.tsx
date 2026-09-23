import React, { useId } from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { DEVICES, SIGNAL_QUALITY } from '../../constants/constants';
import {
  ELECTRODES,
  QUALITY_LABELS,
  UNKNOWN_ELECTRODE,
} from '../../constants/electrodes';

/** One sensor's current contact quality. */
export interface SensorReading {
  /** Channel name, e.g. `AF7`; looked up in `ELECTRODES` for location/fix. */
  channel: string;
  quality: SIGNAL_QUALITY;
}

interface Props {
  device: DEVICES.MUSE | DEVICES.NEUROSITY;
  sensors: SensorReading[];
  onContinue(): void;
}

const DOT: Record<SIGNAL_QUALITY, string> = {
  [SIGNAL_QUALITY.GREAT]: 'bg-signal-great border-signal-great',
  [SIGNAL_QUALITY.OK]: 'bg-signal-ok border-signal-ok',
  [SIGNAL_QUALITY.BAD]: 'bg-signal-bad border-signal-bad',
  [SIGNAL_QUALITY.DISCONNECTED]: 'bg-white border-signal-none',
};

const HEADING = 'm-0 !text-[18px] font-bold !tracking-normal';
const BODY =
  'm-0 !text-[15px] leading-[1.55] !tracking-normal [text-wrap:pretty]';

/**
 * Signal preparation, shown on Explore/Collect after pairing — not inside the
 * pairing modal. Prep checklist first, then what signal quality means, then
 * per-sensor quality as color plus a word plus a fix. Never gates: the
 * student can continue at any quality.
 */
export default function SignalPrep({ device, sensors, onContinue }: Props) {
  const ids = { prep: useId(), meaning: useId(), sensors: useId() };
  const prep = [
    'Sensors need clean, bare skin. Move hair out of the way.',
    ...(device === DEVICES.MUSE
      ? [
          'Tighten the band so the forehead strip and the tips behind your ears sit snugly.',
        ]
      : []),
    'Sit comfortably and keep still — moving, talking and clenching your jaw all show up as noise.',
  ];

  return (
    <div className="flex w-[880px] flex-col gap-[28px] text-left">
      <h1 className="m-0 !text-[32px] !font-light !leading-tight !tracking-[0.3px]">
        Get a clear signal
      </h1>
      <div className="grid grid-cols-2 gap-[24px]">
        <section
          aria-labelledby={ids.prep}
          className="flex flex-col gap-[12px] rounded-[6px] bg-white p-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <h2 id={ids.prep} className={HEADING}>
            1. Get comfortable
          </h2>
          <ol className="m-0 flex flex-col gap-[8px] pl-[20px]">
            {prep.map((t) => (
              <li key={t} className="!text-[15px] leading-normal">
                {t}
              </li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby={ids.meaning}
          className="flex flex-col gap-[12px] rounded-[6px] bg-white p-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <h2 id={ids.meaning} className={HEADING}>
            2. What is signal quality?
          </h2>
          <p className={BODY}>
            Each sensor picks up tiny electrical signals from your brain.{' '}
            <strong>Signal quality</strong> is how clearly a sensor hears them.
          </p>
          <p className={BODY}>
            <strong>Noise</strong> is everything else that sneaks in — hair
            under a sensor, a loose fit, blinking or moving.
          </p>
          <ul
            aria-label="Signal quality key"
            className="m-0 flex list-none flex-wrap gap-x-[16px] gap-y-[6px] p-0 text-[14px]"
          >
            {(Object.keys(QUALITY_LABELS) as SIGNAL_QUALITY[]).map((q) => (
              <li key={q} className="flex items-center gap-[6px]">
                <span
                  aria-hidden
                  className={cn(
                    'h-[12px] w-[12px] rounded-full border-2',
                    DOT[q]
                  )}
                />
                <span className="capitalize">{QUALITY_LABELS[q]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        aria-labelledby={ids.sensors}
        className="flex flex-col gap-[12px]"
      >
        <h2 id={ids.sensors} className={HEADING}>
          3. Check each sensor
        </h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-[10px] p-0">
          {sensors.map(({ channel, quality }) => {
            const meta = ELECTRODES[channel] ?? UNKNOWN_ELECTRODE;
            return (
              <li
                key={channel}
                className="flex items-start gap-[12px] rounded-[6px] bg-white px-[16px] py-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-[4px] h-[16px] w-[16px] flex-none rounded-full border-2',
                    DOT[quality]
                  )}
                />
                <span className="flex flex-col gap-[2px]">
                  <span className="text-[16px] text-ink">
                    <strong>{channel}</strong> · {meta.location} —{' '}
                    <span className="font-bold">{QUALITY_LABELS[quality]}</span>
                  </span>
                  <span className="text-[14px] leading-normal text-ink-muted">
                    {meta.fixes[quality]}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="m-0 !text-[15px] !tracking-normal text-ink-muted">
          Dry sensors often settle in over several minutes. If a sensor is still
          settling, give it time and stay still.
        </p>
      </section>

      <div className="flex">
        <Button size="lg" onClick={onContinue}>
          Start exploring
        </Button>
      </div>
    </div>
  );
}
