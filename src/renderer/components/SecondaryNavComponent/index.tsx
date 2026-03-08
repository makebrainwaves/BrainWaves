import React, { Component } from 'react';
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

interface SettingsState {
  isSettingsOpen: boolean;
}

export default class SecondaryNavComponent extends Component<Props, SettingsState> {
  constructor(props: Props) {
    super(props);
    this.state = { isSettingsOpen: false };
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.activeStep !== this.props.activeStep ||
      nextState.isSettingsOpen !== this.state.isSettingsOpen
    );
  }

  toggleSettings() {
    this.setState((prev) => ({ isSettingsOpen: !prev.isSettingsOpen }));
  }

  renderTitle() {
    if (typeof this.props.title === 'string') {
      return (
        <h3 className={`text-lg font-bold ${styles.secondaryNavContainerExpName}`}>
          {this.props.title}
        </h3>
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
      <div className={`flex items-center ${styles.secondaryNavContainer}`}>
        <div className="w-1/4 flex items-end">
          {this.renderTitle()}
        </div>

        {this.renderSteps()}

        {this.props.enableEEGToggle && (
          <div className="w-1/6 ml-auto">
            <div className={`relative ${styles.settingsButtons}`}>
              <button
                className={`px-3 py-1 rounded border text-gray-700 hover:bg-gray-100 transition-colors ${styles.dropdownSettings}`}
                onClick={this.toggleSettings}
                aria-haspopup="true"
                aria-expanded={this.state.isSettingsOpen}
              >
                ⚙
              </button>
              {this.state.isSettingsOpen && (
                <div
                  className={`absolute right-0 mt-1 bg-white border rounded shadow-lg z-20 min-w-max ${styles.dropdownMenu}`}
                >
                  <div
                    className={`px-4 py-2 ${styles.dropdownItem}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>Enable EEG</div>
                    {this.props.enableEEGToggle}
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <NavLink to={SCREENS.HOME.route}>
                      <p>Exit Experiment</p>
                    </NavLink>
                  </div>
                </div>
              )}
              {this.props.saveButton}
            </div>
          </div>
        )}
      </div>
    );
  }
}
