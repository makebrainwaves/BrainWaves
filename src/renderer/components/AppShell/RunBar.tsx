import React from 'react';
import { Button } from '../ui/button';
import DeviceChip from './DeviceChip';
import WorkspaceIdentity from './WorkspaceIdentity';
import { DeviceState, RunState, ShellWorkspace } from './types';

interface Props {
  run: RunState;
  workspace?: ShellWorkspace;
  device: DeviceState;
  deviceName?: string;
  /** Ends the run immediately — no confirm (plan §1.5); data so far is kept as incomplete. */
  onEndRun?(): void;
  /** Escape is being held; the run ends early once the hold completes. */
  escapeHeld?: boolean;
}

/**
 * Replaces all navigation while an experiment runs. The only place the app
 * says "recording" — in words, with a distinct glyph per run kind.
 */
export default function RunBar({
  run,
  workspace,
  device,
  deviceName,
  onEndRun,
  escapeHeld,
}: Props) {
  const eeg = run.kind === 'eeg';
  return (
    <header
      aria-label="Experiment in progress"
      className="flex h-[64px] min-h-0 items-center gap-[20px] border-b border-[#e5e5e5] bg-white px-[24px] py-0 text-left"
    >
      <div
        role="status"
        aria-label={
          eeg
            ? 'EEG recording in progress'
            : 'Behavior-only run in progress, no EEG'
        }
        className="flex items-center gap-[12px]"
      >
        <span
          aria-hidden
          className={
            eeg
              ? 'h-[12px] w-[12px] rounded-full bg-[#d32f2f] shadow-[0_0_0_4px_#fde3e3]'
              : 'h-[12px] w-[12px] rounded-[2px] border-2 border-ink'
          }
        />
        <span className="text-[14px] font-bold uppercase tracking-[0.5px]">
          {eeg ? 'EEG recording' : 'Behavior only'}
        </span>
        <span className="text-[14px] tabular-nums text-ink-muted">
          {[run.elapsed, run.progress].filter(Boolean).join(' · ')}
          {!eeg && ' · saving key presses, no EEG'}
        </span>
      </div>
      {workspace && (
        <>
          <div aria-hidden className="h-[32px] w-px bg-[#e5e5e5]" />
          <WorkspaceIdentity workspace={workspace} />
        </>
      )}
      <div className="flex-1" />
      <DeviceChip device={device} deviceName={deviceName} />
      {escapeHeld && (
        <span
          role="status"
          className="flex items-center gap-[8px] text-[14px] font-bold text-ink"
        >
          <kbd className="rounded-[4px] border border-b-[3px] border-ink bg-white px-[6px] font-sans text-[12px]">
            Esc
          </kbd>
          Keep holding to end early
        </span>
      )}
      <Button variant="outline" onClick={onEndRun}>
        End experiment early
      </Button>
    </header>
  );
}
