import React from 'react';
import { NavLink } from 'react-router-dom';
import SecondaryNavSegment from './SecondaryNavSegment';
import { SCREENS } from '../../constants/constants';
import { cn } from '../ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08 1.65 1.65 0 0 0 0 1.92Z" />
    </svg>
  );
}

interface SettingsDropdownProps {
  enableEEGToggle?: JSX.Element;
  isEEGEnabled?: boolean;
  onEEGEnabledChange?: (enabled: boolean) => void;
  saveButton?: JSX.Element;
  homeRoute: string;
}

function SettingsDropdown({
  enableEEGToggle,
  isEEGEnabled,
  onEEGEnabledChange,
  saveButton,
  homeRoute,
}: SettingsDropdownProps) {
  const redesigned = isEEGEnabled !== undefined && onEEGEnabledChange;

  return (
    <div className="flex items-center gap-3">
      {saveButton}
      {redesigned && (
        <span
          className={cn(
            'inline-flex h-[26px] items-center gap-2 rounded-full px-2.5 text-xs font-bold tracking-[0.4px]',
            isEEGEnabled
              ? 'bg-[#eef6f5] text-[#00564e]'
              : 'bg-[#f2f2f5] text-[#555]'
          )}
        >
          <span
            className={cn(
              'h-[7px] w-[7px] rounded-full',
              isEEGEnabled ? 'bg-brand' : 'bg-[#999]'
            )}
          />
          EEG {isEEGEnabled ? 'ON' : 'OFF'}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-[26px] items-center gap-1.5 px-2.5 text-sm font-bold tracking-[0.3px] text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <SettingsIcon />
            Settings
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-[272px] rounded-lg border-[#e4e4ea] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
        >
          <DropdownMenuLabel className="px-2.5 pb-1.5 pt-2 text-xs tracking-[0.5px] text-ink-muted">
            EXPERIMENT
          </DropdownMenuLabel>
          {redesigned ? (
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="bg-[#fafafd] p-0 focus:bg-[#fafafd]"
            >
              <label className="flex w-full cursor-pointer items-center gap-3 p-2.5">
                <input
                  type="checkbox"
                  checked={isEEGEnabled}
                  onChange={(event) => onEEGEnabledChange(event.target.checked)}
                  aria-label="EEG recording"
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-[22px] w-10 flex-none items-center rounded-full px-[3px]',
                    isEEGEnabled
                      ? 'justify-end bg-brand'
                      : 'justify-start bg-ink-faint'
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-white" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] text-ink">EEG recording</span>
                  <span className="text-[13px] text-ink-muted">
                    Headset data is collected
                  </span>
                </span>
              </label>
            </DropdownMenuItem>
          ) : (
            enableEEGToggle && (
              <DropdownMenuItem asChild>
                <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                  {enableEEGToggle}
                  <span>EEG enabled</span>
                </label>
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuSeparator className="mx-1 my-2 bg-[#ececf1]" />
          <DropdownMenuItem asChild className="p-2.5 text-[15px]">
            <NavLink to={homeRoute}>Back to Home</NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface Props {
  title: string | React.ReactNode;
  steps: Record<string, string>;
  activeStep: string;
  onStepClick: (step: string) => void;
  saveButton?: JSX.Element;
  enableEEGToggle?: JSX.Element;
  isEEGEnabled?: boolean;
  onEEGEnabledChange?: (enabled: boolean) => void;
}

/**
 * Tab bar with experiment settings for the Custom and Imported authoring
 * flows (and Analyze). Built-in experiments' Prepare lesson uses
 * `PrepareSteps` instead.
 */
export default function SecondaryNavComponent(props: Props) {
  const redesigned = props.isEEGEnabled !== undefined;

  const title =
    typeof props.title === 'string' ? (
      <span className="text-2xl font-normal leading-[29px] tracking-[-0.2px] text-ink">
        {props.title}
      </span>
    ) : (
      props.title
    );

  return (
    <div
      className={cn(
        'flex items-center bg-white',
        redesigned ? 'border-b border-[#ececf1] px-9' : 'px-4 py-2'
      )}
    >
      {!redesigned && <div className="flex w-1/4 items-end">{title}</div>}
      <div className="flex items-stretch gap-1">
        {Object.values(props.steps).map((stepTitle) => (
          <SecondaryNavSegment
            key={stepTitle}
            title={stepTitle}
            active={props.activeStep === stepTitle}
            onClick={() => props.onStepClick(stepTitle)}
          />
        ))}
      </div>
      {(props.enableEEGToggle || redesigned) && (
        <div className="ml-auto">
          <SettingsDropdown
            enableEEGToggle={props.enableEEGToggle}
            isEEGEnabled={props.isEEGEnabled}
            onEEGEnabledChange={props.onEEGEnabledChange}
            saveButton={props.saveButton}
            homeRoute={SCREENS.HOME.route}
          />
        </div>
      )}
      {!props.enableEEGToggle && !redesigned && props.saveButton && (
        <div className="ml-auto">{props.saveButton}</div>
      )}
    </div>
  );
}
