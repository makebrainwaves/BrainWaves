import React from 'react';
import { Grid } from 'semantic-ui-react';
import styles from '../styles/secondarynav.module.css';

interface Props {
  title: string;
  style: string;
  onClick: () => void;
}

export default function SecondaryNavSegment(props: Props) {
  return (
    <Grid.Column
      as="a"
      onClick={props.onClick}
      textAlign="center"
      verticalAlign="bottom"
      className={[props.style, styles.secondaryNavSegment].join(' ')}
    >
      {props.title}
    </Grid.Column>
  );
}
