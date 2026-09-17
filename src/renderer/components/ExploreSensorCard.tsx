import React, { useEffect, useId, useRef } from 'react';
import { SIGNAL_QUALITY } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';
import {
  ELECTRODES,
  QUALITY_LABELS,
  UNKNOWN_ELECTRODE,
} from '../constants/electrodes';

interface Props {
  channels: string[];
  sample: SignalQualityData | null;
  hoveredChannel: string | null;
  onHoveredChannelChange: (channel: string | null) => void;
}

/** A live quality summary with scalp-location help; variability is not electrode impedance. */
export default function ExploreSensorCard({
  channels,
  sample,
  hoveredChannel,
  onHoveredChannelChange,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const activeChannel =
    hoveredChannel && channels.includes(hoveredChannel) ? hoveredChannel : null;
  const metadata = activeChannel
    ? (ELECTRODES[activeChannel] ?? UNKNOWN_ELECTRODE)
    : null;
  const quality = activeChannel
    ? (sample?.signalQuality[activeChannel] ?? SIGNAL_QUALITY.DISCONNECTED)
    : SIGNAL_QUALITY.DISCONNECTED;
  const variability = activeChannel
    ? sample?.info.signalQuality[activeChannel]
    : undefined;

  useEffect(() => {
    if (!activeChannel) return;
    function dismissOutside(event: PointerEvent) {
      const { target } = event;
      if (!(target instanceof Node)) return;
      const surface = cardRef.current?.closest('[data-explore-surface]');
      const insideHead =
        target instanceof Element && target.closest('[data-explore-head]');
      if (
        cardRef.current?.contains(target) ||
        (insideHead && surface?.contains(insideHead))
      )
        return;
      onHoveredChannelChange(null);
    }
    function dismissEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onHoveredChannelChange(null);
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissEscape);
    };
  }, [activeChannel, onHoveredChannelChange]);

  return (
    <div
      ref={cardRef}
      className="relative rounded-lg border border-gray-200 bg-white p-3.5 text-ink"
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') onHoveredChannelChange(null);
      }}
    >
      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.5px] text-ink-muted">
        Sensor quality
      </h2>
      <div className="flex flex-col gap-2">
        {channels.map((channel) => {
          const channelQuality =
            sample?.signalQuality[channel] ?? SIGNAL_QUALITY.DISCONNECTED;
          const active = channel === activeChannel;
          return (
            <div key={channel} className="relative">
              <button
                type="button"
                className={`-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${active ? 'bg-[#f6f8f8]' : 'bg-transparent'}`}
                aria-describedby={active ? tooltipId : undefined}
                onPointerEnter={(event) => {
                  if (event.pointerType !== 'touch')
                    onHoveredChannelChange(channel);
                }}
                onFocus={() => onHoveredChannelChange(channel)}
                onBlur={() => onHoveredChannelChange(null)}
                onClick={() => onHoveredChannelChange(channel)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: channelQuality }}
                  aria-hidden="true"
                />
                <span>
                  {channel} · {QUALITY_LABELS[channelQuality]}
                </span>
              </button>
              {active && metadata && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="absolute left-[calc(100%+12px)] top-0 z-10 w-[250px] rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-ink shadow-[0_12px_24px_-12px_rgba(0,0,0,0.35)] before:absolute before:-left-3 before:top-0 before:h-full before:w-3 before:content-['']"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-1.5 top-3.5 h-2.5 w-2.5 rotate-45 border-b border-l border-gray-200 bg-white"
                  />
                  <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto">
                    <p className="text-[13px] font-bold uppercase tracking-[0.5px] text-ink-muted">
                      {activeChannel} · {metadata.location}
                    </p>
                    <p className="text-sm leading-[21px]">
                      {metadata.description}
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {variability !== undefined && Number.isFinite(variability)
                        ? `Signal variability: ${variability.toFixed(1)} µV (standard deviation).`
                        : 'Signal variability: waiting for a measurement.'}
                    </p>
                    <p className="text-[13px] leading-5 text-ink-muted">
                      {metadata.fixes[quality]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
