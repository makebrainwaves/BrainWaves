import React from 'react';
import styles from '../styles/secondarynav.module.css';

interface Props {
  title: string;
  style: string;
  onClick: () => void;
}

export default function SecondaryNavSegment(props: Props) {
  return (
    <a
      onClick={props.onClick}
      className={[props.style, styles.secondaryNavSegment, 'text-center flex items-end justify-center'].join(' ')}
    >
      {props.title}
    </a>
  );
}
