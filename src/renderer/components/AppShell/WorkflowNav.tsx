import React from 'react';
import { cn } from '../ui/utils';
import { Area, Modality } from './types';

const AREAS: Record<Modality, Area[]> = {
  eeg: ['prepare', 'collect', 'clean', 'analyze'],
  behavior: ['prepare', 'collect', 'analyze'],
};

export const AREA_LABELS: Record<Area, string> = {
  prepare: 'Prepare',
  collect: 'Collect',
  clean: 'Clean',
  analyze: 'Analyze',
};

interface Props {
  modality: Modality;
  /** Gold underline + filled bubble. Absent when not in a workflow area. */
  current?: Area;
  /** Teal "Next →" pill. Ignored when it equals `current`. */
  next?: Area;
  /** Neutral factual pills per area, e.g. `4 recordings`. */
  badges?: Partial<Record<Area, string[]>>;
  onSelect?(area: Area): void;
}

/**
 * Workspace areas as always-selectable tabs (repeatable work, not a locked
 * wizard). Current vs recommended differ in color, fill, shape and text.
 */
export default function WorkflowNav({
  modality,
  current,
  next,
  badges = {},
  onSelect,
}: Props) {
  return (
    <nav aria-label="Workflow" className="flex items-stretch gap-[2px]">
      {AREAS[modality].map((area, i) => {
        const isCurrent = area === current;
        const isNext = area === next && !isCurrent;
        const areaBadges = badges[area] ?? [];
        const label = AREA_LABELS[area];
        return (
          <button
            key={area}
            type="button"
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={[
              label,
              isCurrent && 'current area',
              isNext && 'recommended next',
              ...areaBadges,
            ]
              .filter(Boolean)
              .join(', ')}
            onClick={() => onSelect?.(area)}
            className={cn(
              'flex items-center gap-[8px] whitespace-nowrap border-b-4 px-[14px] pt-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
              isCurrent
                ? 'border-accent'
                : 'border-transparent hover:border-[#ffe08a]'
            )}
          >
            <span
              className={cn(
                'flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold',
                isCurrent
                  ? 'bg-accent text-ink'
                  : 'border-[1.5px] border-[#bdbdbd] text-ink-muted'
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'text-[14px] font-bold uppercase tracking-[0.5px]',
                isCurrent ? 'text-ink' : 'text-ink-muted'
              )}
            >
              {label}
            </span>
            {areaBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-[#f0f0f0] px-[8px] py-[2px] text-[12px] text-[#4a4a4a]"
              >
                {badge}
              </span>
            ))}
            {isNext && (
              <span className="rounded-full border border-brand bg-white px-[7px] py-px text-[11px] font-bold uppercase tracking-[0.5px] text-brand">
                Next →
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
