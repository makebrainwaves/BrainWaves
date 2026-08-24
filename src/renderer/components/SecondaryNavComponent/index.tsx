import React from 'react';
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

function SettingsDropdown({
  enableEEGToggle,
  saveButton,
  homeRoute,
}: SettingsDropdownProps) {
  return (
    <div className="flex items-center gap-2 pr-4">
      {saveButton}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-2xl text-[#666] focus:outline-none px-2">
            ⚙
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <NavLink to={homeRoute}>
              <span>Home</span>
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <label className="flex items-center cursor-pointer gap-2 px-2 py-1.5">
              {enableEEGToggle}
              <span>EEG enabled</span>
            </label>
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

export default function SecondaryNavComponent(props: Props) {
  function renderTitle() {
    if (typeof props.title === 'string') {
      return (
        <span className="font-normal text-2xl leading-[29px] tracking-[-0.2px] text-[#1a1a1a]">
          {props.title}
        </span>
      );
    }
    return props.title;
  }

  function renderSteps() {
    return (
      <>
        {Object.values(props.steps).map((stepTitle) => (
          <SecondaryNavSegment
            key={stepTitle}
            title={stepTitle}
            active={props.activeStep === stepTitle}
            onClick={() => props.onStepClick(stepTitle)}
          />
        ))}
      </>
    );
  }

  return (
    <div className="flex items-center">
      <div className="w-1/4 flex items-end px-4 py-2">{renderTitle()}</div>

      {renderSteps()}

      {props.enableEEGToggle && (
        <div className="ml-auto">
          <SettingsDropdown
            enableEEGToggle={props.enableEEGToggle}
            saveButton={props.saveButton}
            homeRoute={SCREENS.HOME.route}
          />
        </div>
      )}

      {!props.enableEEGToggle && props.saveButton && (
        <div className="ml-auto pr-4">{props.saveButton}</div>
      )}
    </div>
  );
}
