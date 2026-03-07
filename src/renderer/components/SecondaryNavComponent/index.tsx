import React, { Component, useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/secondarynav.module.css';
import SecondaryNavSegment from './SecondaryNavSegment';
import { SCREENS } from '../../constants/constants';

interface SettingsDropdownProps {
  enableEEGToggle: JSX.Element;
  saveButton?: JSX.Element;
  dropdownSettings: string;
  dropdownMenu: string;
  dropdownItem: string;
  homeRoute: string;
}

function SettingsDropdown({ enableEEGToggle, saveButton, dropdownSettings, dropdownMenu, dropdownItem, homeRoute }: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={dropdownSettings} onClick={() => setOpen((o) => !o)} aria-label="Settings">
        ⚙
      </button>
      {open && (
        <div className={dropdownMenu} style={{ position: 'absolute', right: 0, zIndex: 50 }}>
          <div className={dropdownItem} onClick={(e) => e.stopPropagation()}>
            <div>Enable EEG</div>
            {enableEEGToggle}
          </div>
          <div className={dropdownItem}>
            <NavLink to={homeRoute} onClick={() => setOpen(false)}>
              <p>Exit Experiment</p>
            </NavLink>
          </div>
        </div>
      )}
      {saveButton}
    </div>
  );
}

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
        <span className={styles.secondaryNavContainerExpName}>
          {this.props.title}
        </span>
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
      <div className={['flex items-center', styles.secondaryNavContainer].join(' ')}>
        <div className="w-1/4 flex items-end">
          {this.renderTitle()}
        </div>

        {this.renderSteps()}

        {this.props.enableEEGToggle && (
          <div className="ml-auto">
            <div className={styles.settingsButtons}>
              <SettingsDropdown
                enableEEGToggle={this.props.enableEEGToggle}
                saveButton={this.props.saveButton}
                dropdownSettings={styles.dropdownSettings}
                dropdownMenu={styles.dropdownMenu}
                dropdownItem={styles.dropdownItem}
                homeRoute={SCREENS.HOME.route}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}
