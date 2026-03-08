import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/topnavbar.module.css';

interface Props {
  style: string;
  route: string;
  title: string;
  order: number;
}

const PrimaryNavSegment = (props) => {
  return (
    <div className={[props.style, styles.navColumn].join(' ')}>
      <NavLink to={props.route}>
        <div className={styles.numberBubble}>{props.order}</div>
        {props.title}
      </NavLink>
    </div>
  );
};

export default PrimaryNavSegment;
