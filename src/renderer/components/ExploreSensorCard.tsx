import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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

interface PopoverPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  notchTop: number;
  flipped: boolean;
}

/** A live quality summary with scalp-location help; variability is not electrode impedance. */
export default function ExploreSensorCard({
  channels,
  sample,
  hoveredChannel,
  onHoveredChannelChange,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef(new Map<string, HTMLButtonElement>());
  const closeTimer = useRef<number | undefined>(undefined);
  const tooltipId = useId();
  const [position, setPosition] = useState<PopoverPosition | null>(null);
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

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(
      () => onHoveredChannelChange(null),
      250
    );
  }

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
    },
    []
  );

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
        popoverRef.current?.contains(target) ||
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

  useLayoutEffect(() => {
    if (!activeChannel) {
      setPosition(null);
      return;
    }
    const card = cardRef.current;
    const row = rowsRef.current.get(activeChannel);
    const popover = popoverRef.current;
    if (!card || !row || !popover) return;

    function placePopover() {
      if (!card || !row || !popover) return;
      const cardRect = card.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const surface = card.closest('[data-explore-surface]');
      const trace = surface
        ?.querySelector('[data-explore-trace]')
        ?.getBoundingClientRect();
      const lessons = surface
        ?.querySelector('[data-explore-lessons]')
        ?.getBoundingClientRect();
      const width = Math.min(250, window.innerWidth - 16);
      // Sits directly beside its own card; flips left only at the viewport edge.
      const right = cardRect.right + 12;
      const flipped = right + width > window.innerWidth - 8;
      const left = flipped
        ? Math.max(
            8,
            Math.min(cardRect.right - width, window.innerWidth - width - 8)
          )
        : right;
      const topBoundary = Math.max(8, trace?.top ?? 8);
      const bottomBoundary = Math.min(
        window.innerHeight - 8,
        lessons ? lessons.top - 10 : window.innerHeight - 8
      );
      const maxHeight = Math.max(40, bottomBoundary - topBoundary);
      const height = Math.min(popover.scrollHeight, maxHeight);
      const top = Math.max(
        topBoundary,
        Math.min(rowRect.top - 6, bottomBoundary - height)
      );
      const notchTop = Math.max(
        12,
        Math.min(rowRect.top + rowRect.height / 2 - top - 5, height - 20)
      );
      setPosition({ left, top, width, maxHeight, notchTop, flipped });
    }

    placePopover();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(placePopover);
    observer?.observe(card);
    observer?.observe(popover);
    window.addEventListener('resize', placePopover);
    window.addEventListener('scroll', placePopover, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', placePopover);
      window.removeEventListener('scroll', placePopover, true);
    };
  }, [activeChannel]);

  return (
    <div
      ref={cardRef}
      className="relative rounded-lg border border-gray-200 bg-white p-3.5 text-ink"
      onPointerEnter={cancelClose}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') scheduleClose();
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
            <button
              key={channel}
              ref={(node) => {
                if (node) rowsRef.current.set(channel, node);
                else rowsRef.current.delete(channel);
              }}
              type="button"
              className={`-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${active ? 'bg-[#f6f8f8]' : 'bg-transparent'}`}
              aria-describedby={active ? tooltipId : undefined}
              onPointerEnter={(event) => {
                cancelClose();
                if (event.pointerType !== 'touch')
                  onHoveredChannelChange(channel);
              }}
              onFocus={() => {
                cancelClose();
                onHoveredChannelChange(channel);
              }}
              onBlur={(event) => {
                if (!popoverRef.current?.contains(event.relatedTarget))
                  onHoveredChannelChange(null);
              }}
              onClick={() => {
                cancelClose();
                onHoveredChannelChange(channel);
              }}
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
          );
        })}
      </div>
      {activeChannel &&
        metadata &&
        createPortal(
          <div
            ref={popoverRef}
            id={tooltipId}
            role="tooltip"
            className="fixed z-[5] rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-ink"
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              width: position?.width ?? 250,
              maxHeight: position?.maxHeight,
              visibility: position ? 'visible' : 'hidden',
              boxShadow: '0 12px 24px -12px rgba(0,0,0,0.35)',
            }}
            onPointerEnter={cancelClose}
            onPointerLeave={(event) => {
              if (event.pointerType !== 'touch') scheduleClose();
            }}
          >
            <span
              aria-hidden="true"
              className={`absolute h-2.5 w-2.5 rotate-45 bg-white ${position?.flipped ? '-right-1.5 border-r border-t' : '-left-1.5 border-b border-l'} border-gray-200`}
              style={{ top: position?.notchTop ?? 14 }}
            />
            <div
              className="flex flex-col gap-2 overflow-y-auto"
              style={{
                maxHeight: position ? position.maxHeight - 26 : undefined,
              }}
            >
              <p className="text-[13px] font-bold uppercase tracking-[0.5px] text-ink-muted">
                {activeChannel} · {metadata.location}
              </p>
              <p className="text-sm leading-[21px]">{metadata.description}</p>
              <p className="text-[13px] text-ink-muted">
                {variability !== undefined && Number.isFinite(variability)
                  ? `Signal variability: ${variability.toFixed(1)} µV (standard deviation).`
                  : 'Signal variability: waiting for a measurement.'}
              </p>
              <p className="text-[13px] leading-5 text-ink-muted">
                {metadata.fixes[quality]}
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
