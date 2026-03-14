import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import SecondaryNavSegment from './SecondaryNavSegment';
import { SCREENS } from '../../constants/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface SettingsDropdownProps {
  enableEEGToggle: JSX.Element;
  saveButton?: JSX.Element;
  homeRoute: string;
}

function SettingsDropdown({ enableEEGToggle, saveButton, homeRoute }: SettingsDropdownProps) {
  return (
    <div className="flex items-center gap-2 pr-4">
      {saveButton}
      <DropdownMenu>
        <DropdownMenuTrigger className="text-2xl text-[#666] focus:outline-none px-2">
          ⚙
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[240px]">
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="flex items-center justify-between"
          >
            <span>Enable EEG</span>
            {enableEEGToggle}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <NavLink to={homeRoute} className="w-full">
              Exit Experiment
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        <span className="font-normal text-2xl leading-[29px] tracking-[-0.2px] text-[#1a1a1a]">
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
            active={this.props.activeStep === stepTitle}
            onClick={() => this.props.onStepClick(stepTitle)}
          />
        ))}
      </>
    );
  }

  render() {
    return (
      <div className="flex items-center">
        <div className="w-1/4 flex items-end px-4 py-2">
          {this.renderTitle()}
        </div>

        {this.renderSteps()}

        {this.props.enableEEGToggle && (
          <div className="ml-auto">
            <SettingsDropdown
              enableEEGToggle={this.props.enableEEGToggle}
              saveButton={this.props.saveButton}
              homeRoute={SCREENS.HOME.route}
            />
          </div>
        )}

        {!this.props.enableEEGToggle && this.props.saveButton && (
          <div className="ml-auto pr-4">
            {this.props.saveButton}
          </div>
        )}
      </div>
    );
  }
}
