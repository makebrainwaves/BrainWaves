import React, { Component } from 'react';
import { Grid, Header, Dropdown } from 'semantic-ui-react';
import styles from '../styles/secondarynav.css';
import SecondaryNavSegment from './SecondaryNavSegment';
import { NavLink } from 'react-router-dom';
import { SCREENS } from '../../constants/constants';

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
      return <Header className={styles.secondaryNavContainerExpName}>{this.props.title}</Header>;
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
        <Grid.Column width={3}>{this.renderTitle()}</Grid.Column>
        {this.renderSteps()}

        {this.props.enableEEGToggle &&
          <Grid.Column width={2} floated="right">
            <div className={styles.settingsButtons}>
              <Dropdown icon='setting' direction="left" fluid className={styles.dropdownSettings}>
                <Dropdown.Menu className={styles.dropdownMenu}>
                  <Dropdown.Item className={styles.dropdownItem}>
                    <div>Enable EEG</div>
                    {this.props.enableEEGToggle}
                  </Dropdown.Item>
                  {this.props.canEditExperiment &&
                    <Dropdown.Item
                      text='Edit Experiment'
                      onClick={() => this.props.onEditClick()}
                    />
                  }
                  <Dropdown.Item>
                    <NavLink to={SCREENS.HOME.route}>
                      <p>
                        Exit Experiment
                      </p>
                    </NavLink>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              {this.props.saveButton}
            </div>
          </Grid.Column>
        }
      </Grid>
    );
  }
}
