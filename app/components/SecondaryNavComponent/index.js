import React, { Component } from 'react';
import { Grid, Header } from 'semantic-ui-react';
import styles from '../styles/secondarynav.css';
import SecondaryNavSegment from './SecondaryNavSegment';

interface Props {
  title: string | React.ReactNode;
  steps: { [string]: string };
  activeStep: string;
  onStepClick: string => void;
}

export default class SecondaryNavComponent extends Component<Props> {
  renderTitle() {
    if (typeof this.props.title === 'string') {
      return <Header as="h1">{this.props.title}</Header>;
    }
    return this.props.title;
  }

  renderSteps() {
    return (
      <React.Fragment>
        {Object.values(this.props.steps).map(stepTitle => (
          <SecondaryNavSegment
            key={stepTitle}
            title={stepTitle}
            style={
              this.props.activeStep === stepTitle
                ? styles.activeSecondaryNavSegment
                : styles.inactiveSecondaryNavSegment
            }
            onClick={() => this.props.onStepClick(stepTitle)}
          />
        ))}
      </React.Fragment>
    );
  }

  render() {
    return (
      <Grid verticalAlign="middle" className={styles.secondaryNavContainer}>
        <Grid.Column width="4">{this.renderTitle()}</Grid.Column>
        {this.renderSteps()}
      </Grid>
    );
  }
}
