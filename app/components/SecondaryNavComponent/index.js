import React, { Component } from 'react';
import { Grid, Header } from 'semantic-ui-react';
import styles from '../styles/secondarynav.css';
import SecondaryNavSegment from './SecondaryNavSegment';

interface Props {
  title: string | React.ReactNode;
  steps: { [string]: string };
  activeStep: string;
  onStepClick: string => void;
  button?: React.ReactNode;
}

export default class SecondaryNavComponent extends Component<Props> {
  shouldComponentUpdate(nextProps) {
    return nextProps.activeStep !== this.props.activeStep;
  }

  renderTitle() {
    if (typeof this.props.title === 'string') {
      return <Header as="h2">{this.props.title}</Header>;
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
        {this.props.button ? (
          <Grid.Column width="5" floated="right" textAlign="right">
            {this.props.button}
          </Grid.Column>
        ) : null}
      </React.Fragment>
    );
  }

  render() {
    return (
      <Grid verticalAlign="middle" className={styles.secondaryNavContainer}>
        <Grid.Column width={3}>{this.renderTitle()}</Grid.Column>
        {this.renderSteps()}
      </Grid>
    );
  }
}
