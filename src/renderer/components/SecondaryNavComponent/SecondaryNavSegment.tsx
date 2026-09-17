import React from 'react';
import { cn } from '../ui/utils';

interface Props {
  title: string;
  active: boolean;
  onClick: () => void;
}

export default function SecondaryNavSegment(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'flex min-w-fit cursor-pointer items-end justify-center border-b-4 px-3.5 pb-3.5 pt-[18px] text-center text-sm font-bold tracking-[0.5px]',
        props.active
          ? 'text-ink border-accent'
          : 'text-ink-muted border-transparent hover:text-ink hover:border-accent-light'
      )}
    >
      {props.title}
    </button>
  );
}
