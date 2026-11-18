import React, { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import SignalPrep from './SignalPrep';
import { DEVICES, SIGNAL_QUALITY } from '../../constants/constants';
import { SignalQualityData } from '../../constants/interfaces';

interface Props {
  device: DEVICES.MUSE | DEVICES.NEUROSITY;
  observable: Observable<SignalQualityData> | null | undefined;
  /** Connected device's channel names; missing readings show as disconnected. */
  channels: string[];
  onContinue(): void;
}

/** With no quality sample after this long, Continue opens anyway: a paired headset whose stream never starts must not trap the screen. */
export const SIGNAL_STALL_MS = 15_000;

/** `SignalPrep` fed by the live signal-quality stream, centered in its host screen. */
export default function LiveSignalPrep({
  device,
  observable,
  channels,
  onContinue,
}: Props) {
  const [quality, setQuality] = useState<Record<string, SIGNAL_QUALITY> | null>(
    null
  );
  const [stalled, setStalled] = useState(false);
  const waiting = quality === null;

  useEffect(() => {
    const sub = observable?.subscribe((chunk) =>
      setQuality(chunk.signalQuality)
    );
    return () => sub?.unsubscribe();
  }, [observable]);

  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setTimeout(() => setStalled(true), SIGNAL_STALL_MS);
    return () => clearTimeout(timer);
  }, [waiting]);

  return (
    <div className="flex h-full justify-center overflow-auto py-[32px]">
      <SignalPrep
        device={device}
        sensors={channels.map((channel) => ({
          channel,
          quality: quality?.[channel] ?? SIGNAL_QUALITY.DISCONNECTED,
        }))}
        head={observable}
        signal={!waiting ? 'live' : stalled ? 'stalled' : 'waiting'}
        onContinue={onContinue}
      />
    </div>
  );
}
