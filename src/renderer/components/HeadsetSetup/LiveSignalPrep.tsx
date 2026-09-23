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

/** `SignalPrep` fed by the live signal-quality stream, centered in its host screen. */
export default function LiveSignalPrep({
  device,
  observable,
  channels,
  onContinue,
}: Props) {
  const [quality, setQuality] = useState<Record<string, SIGNAL_QUALITY>>({});

  useEffect(() => {
    const sub = observable?.subscribe((chunk) =>
      setQuality(chunk.signalQuality)
    );
    return () => sub?.unsubscribe();
  }, [observable]);

  return (
    <div className="flex h-full justify-center overflow-auto py-[40px]">
      <SignalPrep
        device={device}
        sensors={channels.map((channel) => ({
          channel,
          quality: quality[channel] ?? SIGNAL_QUALITY.DISCONNECTED,
        }))}
        onContinue={onContinue}
      />
    </div>
  );
}
