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
        'flex items-end justify-center text-center text-sm font-bold tracking-[0.5px] border-b-4 min-w-fit px-4 pb-1 cursor-pointer',
        props.active
          ? 'text-[#1a1a1a] border-accent'
          : 'text-[#666] border-transparent hover:text-[#1a1a1a] hover:border-accent-light'
      )}
    >
      {props.title}
    </button>
  );
}
