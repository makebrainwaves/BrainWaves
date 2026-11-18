import React, { useId } from 'react';
import { Observable } from 'rxjs';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import {
  DEVICES,
  PLOTTING_INTERVAL,
  SIGNAL_QUALITY,
} from '../../constants/constants';
import { SignalQualityData } from '../../constants/interfaces';
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
  /** The head diagram's stream: the live stream in the app, `of(...)` in stories. */
  head: Observable<SignalQualityData> | null | undefined;
  /** No quality sample has arrived yet; Continue stays off until one does. */
  waiting?: boolean;
  onContinue(): void;
}

const DOT: Record<SIGNAL_QUALITY, string> = {
  [SIGNAL_QUALITY.GREAT]: 'bg-signal-great border-signal-great',
  [SIGNAL_QUALITY.OK]: 'bg-signal-ok border-signal-ok',
  [SIGNAL_QUALITY.BAD]: 'bg-signal-bad border-signal-bad',
  [SIGNAL_QUALITY.DISCONNECTED]: 'bg-white border-signal-none',
};

/**
 * Signal preparation, shown on Explore/Collect after pairing — not inside the
 * pairing modal. Live head map and a short checklist beside one compact row
 * per sensor (a fix appears only while a sensor is not good). Continue opens
 * once the first quality sample arrives and never gates on quality.
 */
export default function SignalPrep({
  device,
  sensors,
  head,
  waiting = false,
  onContinue,
}: Props) {
  const ids = { prep: useId(), sensors: useId() };
  const prep = [
    'Move hair so each sensor touches bare skin.',
    ...(device === DEVICES.MUSE
      ? ['Snug the band on your forehead and behind your ears.']
      : []),
    'Sit still: talking, moving and clenching your jaw add noise.',
  ];
  const allGood = sensors.every((s) => s.quality === SIGNAL_QUALITY.GREAT);

  return (
    <div className="flex w-[880px] flex-col gap-[20px] text-left">
      <h1 className="m-0 !text-[32px] !font-light !leading-tight !tracking-[0.3px]">
        Get a clear signal
      </h1>
      <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-[24px]">
        <div className="flex flex-col gap-[16px]">
          <div className="flex justify-center rounded-[6px] bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <SignalQualityIndicatorComponent
              signalQualityObservable={head}
              plottingInterval={PLOTTING_INTERVAL}
              height={220}
              channels={sensors.map((s) => s.channel)}
            />
          </div>
          <section aria-labelledby={ids.prep}>
            <h2
              id={ids.prep}
              className="m-0 mb-[8px] !text-[15px] font-bold !tracking-normal text-ink-muted"
            >
              Before you start
            </h2>
            <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
              {prep.map((t) => (
                <li
                  key={t}
                  className="flex gap-[8px] text-[15px] leading-snug text-ink"
                >
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section
          aria-labelledby={ids.sensors}
          className="flex flex-col gap-[12px]"
        >
          <h2
            id={ids.sensors}
            className="m-0 !text-[15px] font-bold !tracking-normal text-ink-muted"
          >
            Sensors
          </h2>
          <ul className="m-0 flex list-none flex-col divide-y divide-[#ececf1] rounded-[6px] bg-white p-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {sensors.map(({ channel, quality }) => {
              const meta = ELECTRODES[channel] ?? UNKNOWN_ELECTRODE;
              return (
                <li key={channel} className="px-[16px] py-[10px]">
                  <div className="flex items-center gap-[10px] text-[16px]">
                    <span
                      aria-hidden
                      className={cn(
                        'h-[14px] w-[14px] flex-none rounded-full border-2',
                        DOT[quality]
                      )}
                    />
                    <strong>{channel}</strong>
                    <span className="text-ink-muted">{meta.location}</span>
                    <span className="ml-auto font-bold">
                      {QUALITY_LABELS[quality]}
                    </span>
                  </div>
                  {quality !== SIGNAL_QUALITY.GREAT && (
                    <p className="m-0 mt-[2px] pl-[24px] !text-[14px] !leading-snug !tracking-normal text-ink-muted">
                      {meta.fixes[quality]}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <p
            role="status"
            className="m-0 !text-[15px] !leading-snug !tracking-normal text-ink-muted"
          >
            {waiting
              ? 'Waiting for the headset signal…'
              : allGood
                ? 'All sensors look good.'
                : 'Signal still settling. Dry sensors can take a few minutes; you can continue anytime.'}
          </p>
          <div className="flex">
            <Button size="lg" onClick={onContinue} disabled={waiting}>
              Continue
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
