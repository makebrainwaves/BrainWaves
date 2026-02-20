import React, { Component } from 'react';
import { Grid, Header, Dropdown } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/secondarynav.module.css';
import SecondaryNavSegment from './SecondaryNavSegment';
import { SCREENS } from '../../constants/constants';

interface Props {
  title: string | React.ReactNode;
  steps: {
    [key: string]: string;
  };
  activeStep: string;
  onStepClick: (arg0: string) => void;
  saveButton?: JSX.Element;
  enableEEGToggle?: JSX.Element;
}

export default class SecondaryNavComponent extends Component<Props> {
  shouldComponentUpdate(nextProps) {
    return nextProps.activeStep !== this.props.activeStep;
  }

  renderTitle() {
    if (typeof this.props.title === 'string') {
      return (
        <Header className={styles.secondaryNavContainerExpName}>
          {this.props.title}
        </Header>
      );
    }
    return this.props.title;
  }

  renderSteps() {
    return (
      <>
        {Object.values(this.props.steps).map((stepTitle) => (
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
      </>
    );
  }

  render() {
    return (
      <Grid verticalAlign="middle" className={styles.secondaryNavContainer}>
        <Grid.Column width={3} verticalAlign="bottom">
          {this.renderTitle()}
        </Grid.Column>

        {this.renderSteps()}

        {this.props.enableEEGToggle && (
          <Grid.Column width={2} floated="right">
            <div className={styles.settingsButtons}>
              <Dropdown
                icon="setting"
                direction="left"
                fluid
                className={styles.dropdownSettings}
              >
                <Dropdown.Menu className={styles.dropdownMenu}>
                  <Dropdown.Item
                    className={styles.dropdownItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>Enable EEG</div>
                    {this.props.enableEEGToggle}
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <NavLink to={SCREENS.HOME.route}>
                      <p>Exit Experiment</p>
                    </NavLink>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              {this.props.saveButton}
            </div>
          </Grid.Column>
        )}
      </Grid>
    );
  }
}
