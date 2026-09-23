import React from 'react';
import { Button } from '../ui/button';

interface Props {
  title: string;
  /** Says what is missing and where to get it. */
  body: string;
  /** Points at the unblocking area, e.g. `Go to Collect`. */
  ctaLabel: string;
  onCta?(): void;
}

/** Shown instead of disabling a workflow area that has nothing to work on yet. */
export default function BlockedAreaEmptyState({
  title,
  body,
  ctaLabel,
  onCta,
}: Props) {
  return (
    <div className="px-[56px] pb-[48px] pt-[40px]">
      <div className="flex max-w-[760px] flex-col items-start gap-[12px] rounded-[6px] bg-[#ececf1] p-[48px]">
        <h1 className="m-0 !text-[28px] !font-light !leading-tight !tracking-[0.3px]">
          {title}
        </h1>
        <p className="m-0 max-w-[560px] !text-[17px] leading-[1.55] !tracking-normal [text-wrap:pretty]">
          {body}
        </p>
        <Button size="lg" className="mt-[8px]" onClick={onCta}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
