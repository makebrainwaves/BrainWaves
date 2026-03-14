import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../ui/utils';

interface Props {
  status: 'active' | 'visited' | 'initial';
  route: string;
  title: string;
  order: number;
}

const navColumnBase =
  'flex justify-center items-center h-full text-sm font-bold tracking-[0.5px] border-b-4 px-4';

const statusStyles = {
  active: 'text-[#1a1a1a] border-accent',
  visited: 'text-[#1a1a1a] border-accent',
  initial: 'text-[#666] border-transparent hover:text-[#1a1a1a] hover:border-accent-light',
};

const bubbleStyles = {
  active: 'border-accent text-accent',
  visited: 'border-[#666] text-[#666]',
  initial: 'border-[#ccc] text-[#ccc]',
};

const PrimaryNavSegment = (props: Props) => {
  return (
    <div className={cn(navColumnBase, statusStyles[props.status])}>
      <NavLink to={props.route} className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full h-[23px] w-[23px] border-2 text-xs',
            bubbleStyles[props.status]
          )}
        >
          {props.order}
        </span>
        {props.title}
      </NavLink>
    </div>
  );
};

export default PrimaryNavSegment;
