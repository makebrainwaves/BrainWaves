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
        'flex items-end justify-center text-center text-sm font-bold tracking-[0.5px] border-b-4 min-w-fit px-4 pb-2 cursor-pointer',
        props.active
          ? 'text-ink border-accent'
          : 'text-ink-muted border-transparent hover:text-ink hover:border-accent-light'
      )}
    >
      {props.title}
    </button>
  );
}
