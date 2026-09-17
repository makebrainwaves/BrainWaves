import React, { useEffect, useRef } from 'react';
import { Observable } from 'rxjs';
import SignalQualityIndicatorSVG from './svgs/SignalQualityIndicatorSVG';
import { SignalQualityData } from '../constants/interfaces';
import { SIGNAL_QUALITY } from '../constants/constants';
import { QUALITY_LABELS } from '../constants/electrodes';

interface Props {
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  plottingInterval: number;
  height?: number;
  channels?: string[];
  hoveredChannel?: string | null;
  onHoveredChannelChange?: (channel: string | null) => void;
}

/** Updates only this diagram's SVG nodes as epochs arrive; hover state is shared with its sensor list. */
export default function SignalQualityIndicatorComponent(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const electrodesRef = useRef(new Map<string, SVGGElement>());
  const propsRef = useRef(props);
  propsRef.current = props;
  const interactive = props.onHoveredChannelChange !== undefined;

  useEffect(() => {
    const electrodes = electrodesRef.current;
    containerRef.current
      ?.querySelectorAll<SVGGElement>('[data-electrode]')
      .forEach((node) => electrodes.set(node.dataset.electrode!, node));
    return () => electrodes.clear();
  }, []);

  useEffect(() => {
    const electrodes = electrodesRef.current;
    electrodes.forEach((node, channel) => {
      const visible = props.channels?.includes(channel) ?? false;
      node.setAttribute('visibility', visible ? 'visible' : 'hidden');
      node.setAttribute('aria-label', `${channel} · no signal`);
      node.setAttribute('role', interactive ? 'button' : 'img');
      node.setAttribute('tabindex', visible && interactive ? '0' : '-1');
      node.style.cursor = interactive ? 'pointer' : 'default';
      const circle = node.querySelector('circle');
      if (circle) circle.style.fill = SIGNAL_QUALITY.DISCONNECTED;
    });
  }, [props.channels, props.signalQualityObservable, interactive]);

  useEffect(() => {
    const subscription = props.signalQualityObservable?.subscribe({
      next: (epoch) => {
        const { current } = propsRef;
        electrodesRef.current.forEach((node, channel) => {
          const quality =
            epoch.signalQuality[channel] ?? SIGNAL_QUALITY.DISCONNECTED;
          const visible = current.channels
            ? current.channels.includes(channel)
            : channel in epoch.signalQuality;
          node.setAttribute('visibility', visible ? 'visible' : 'hidden');
          node.setAttribute(
            'tabindex',
            visible && current.onHoveredChannelChange ? '0' : '-1'
          );
          node.setAttribute(
            'aria-label',
            `${channel} · ${QUALITY_LABELS[quality]}`
          );
          const circle = node.querySelector('circle');
          if (circle) {
            circle.style.transition = `fill ${current.plottingInterval}ms linear`;
            circle.style.fill = quality;
          }
        });
      },
      error: (error) =>
        console.error('[signal-quality] subscription error:', error),
    });
    return () => subscription?.unsubscribe();
  }, [props.signalQualityObservable]);

  useEffect(() => {
    electrodesRef.current.forEach((node, channel) => {
      const active = channel === props.hoveredChannel;
      if (interactive) node.setAttribute('aria-pressed', String(active));
      else node.removeAttribute('aria-pressed');
      const circle = node.querySelector('circle');
      if (circle) {
        circle.style.stroke = active ? '#007c70' : '#000';
        circle.style.strokeWidth = active ? '8' : '2';
      }
    });
  }, [props.hoveredChannel, interactive]);

  function activate(target: EventTarget | null) {
    if (!(target instanceof Element)) return;
    const electrode = target.closest<SVGGElement>('[data-electrode]');
    if (electrode && containerRef.current?.contains(electrode)) {
      props.onHoveredChannelChange?.(electrode.dataset.electrode ?? null);
    }
  }

  return (
    <div
      ref={containerRef}
      data-explore-head
      onPointerOver={(event) => activate(event.target)}
      onPointerLeave={() => props.onHoveredChannelChange?.(null)}
      onFocus={(event) => activate(event.target)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          props.onHoveredChannelChange?.(null);
        }
      }}
      onClick={(event) => activate(event.target)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          props.onHoveredChannelChange?.(null);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(event.target);
        }
      }}
    >
      <SignalQualityIndicatorSVG
        height={props.height ?? 250}
        style={props.height === undefined ? { minWidth: 250 } : undefined}
      />
    </div>
  );
}
