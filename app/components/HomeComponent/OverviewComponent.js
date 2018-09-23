import React, { Component } from 'react';
import styles from '../styles/common.css';
import { EXPERIMENTS } from '../../constants/constants';
import SecondaryNavComponent from '../SecondaryNavComponent';

const OVERVIEW_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'EXPERIMENTAL PROTOCOL',
  DATA: 'PRE-COLLECTED DATA'
};

interface Props {
  type: EXPERIMENTS;
  onStartExperiment: EXPERIMENTS => void;
}

interface State {
  activeStep: OVERVIEW_STEPS;
}

export default class OverviewComponent extends Component<Props, State> {
  props: Props;
  state: State;

  render() {
    return (
      <div className={styles.mainContainer} data-tid="container">
        <SecondaryNavComponent />
        {this.renderSectionContent()}
      </div>
    );
  }
}
