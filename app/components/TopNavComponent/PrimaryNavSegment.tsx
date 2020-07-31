import React from 'react';
import { Grid } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/topnavbar.css';

interface Props {
  style: string;
  route: string;
  title: string;
  order: number;
}

const PrimaryNavSegment = props => {
  return (
    <Grid.Column
      width={2}
      className={[props.style, styles.navColumn].join(' ')}
    >
      <NavLink to={props.route}>
        <div className={styles.numberBubble}>{props.order}</div>
        {props.title}
      </NavLink>
    </Grid.Column>
  );
};

export default PrimaryNavSegment;
