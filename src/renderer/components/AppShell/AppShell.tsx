import React, { ReactNode } from 'react';
import { cn } from '../ui/utils';
import DeviceChip from './DeviceChip';
import RunBar from './RunBar';
import WorkflowNav from './WorkflowNav';
import WorkspaceIdentity from './WorkspaceIdentity';
import { Area, DeviceState, RunState, ShellWorkspace } from './types';

export interface AppShellProps {
  location: 'home' | Area;
  /** Omitted on Home before any workspace is open; hides identity + workflow. */
  workspace?: ShellWorkspace;
  /** Computed recommendation; never the current area. */
  nextArea?: Area;
  badges?: Partial<Record<Area, string[]>>;
  device: DeviceState;
  deviceName?: string;
  /** Present while an experiment runs; swaps the bar for the RunBar. */
  run?: RunState;
  onSelectArea?(area: Area): void;
  onHome?(): void;
  onEndRun?(): void;
  /** The current screen, rendered on the app gradient under the bar. */
  children?: ReactNode;
}

const divider = (
  <div aria-hidden className="mx-[8px] my-[14px] w-px bg-[#e5e5e5]" />
);

/**
 * Global chrome: Home, workspace identity, workflow areas and device status
 * — or the RunBar while an experiment runs. Pure props; containers
 * wire Redux.
 */
export default function AppShell({
  location,
  workspace,
  nextArea,
  badges,
  device,
  deviceName,
  run,
  onSelectArea,
  onHome,
  onEndRun,
  children,
}: AppShellProps) {
  const onHomePage = location === 'home';
  return (
    <div className="flex h-screen min-w-[1180px] flex-col bg-white text-ink">
      {run ? (
        <RunBar
          run={run}
          workspace={workspace}
          device={device}
          deviceName={deviceName}
          onEndRun={onEndRun}
        />
      ) : (
        <header className="flex h-[64px] min-h-0 items-stretch border-b border-[#e5e5e5] bg-white px-[24px] py-0 text-left">
          <nav aria-label="App" className="flex items-stretch">
            <button
              type="button"
              aria-current={onHomePage ? 'page' : undefined}
              onClick={onHome}
              className={cn(
                'flex items-center border-b-4 px-[16px] pt-[4px] text-[14px] font-bold uppercase tracking-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                onHomePage
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              Home
            </button>
          </nav>
          {workspace && (
            <>
              {divider}
              <WorkspaceIdentity
                workspace={workspace}
                className="max-w-[240px] px-[16px]"
              />
              {divider}
              <WorkflowNav
                modality={workspace.modality}
                current={onHomePage ? undefined : location}
                next={nextArea}
                badges={badges}
                onSelect={onSelectArea}
              />
            </>
          )}
          <div className="flex-1" />
          <div className="flex items-center">
            <DeviceChip device={device} deviceName={deviceName} />
          </div>
        </header>
      )}
      <div className="flex-1 overflow-y-auto bg-app">{children}</div>
    </div>
  );
}
