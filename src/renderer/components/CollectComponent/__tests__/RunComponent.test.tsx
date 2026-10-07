import fs from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONNECTION_STATUS, EXPERIMENTS } from '../../../constants/constants';
import { recordingExists } from '../../../../main/recordings';
import { nextFreeSession } from '../../../utils/filesystem/storage';
import Run from '../RunComponent';

type RuntimeProps = { onAbort?(csv: string): void };

const runtime = vi.hoisted(() => ({ props: null as null | RuntimeProps }));

vi.mock('lab.js', () => ({}));
vi.mock('../../ExperimentRuntime', async () => {
  // vi.mock factories are hoisted above static imports, so React is loaded here.
  const { useEffect } = await import('react');
  return {
    ExperimentRuntime: (props: RuntimeProps) => {
      runtime.props = props;
      useEffect(() => () => runtime.props?.onAbort?.('partial'), []);
      return <div data-testid="runtime" />;
    },
  };
});
vi.mock('../../../utils/labjs/functions', () => ({
  getExperimentFromType: () => ({ text: { protocol: {} } }),
}));
vi.mock('../../../utils/eeg', () => ({ emitMarker: vi.fn() }));
vi.mock('../../../utils/eeg/markerRegistry', () => ({
  resolveMarkerRegistry: () => ({}),
}));
vi.mock('../../InputCollect', () => ({ default: () => null }));
vi.mock('../../../utils/filesystem/storage', () => ({
  nextFreeSession: vi.fn(async (...args: unknown[]) => args[3]),
}));

const Stop = vi.fn();
const Start = vi.fn();
const props = {
  type: EXPERIMENTS.N170,
  title: 'Study',
  isRunning: true,
  isEnding: false,
  runOutcome: null,
  recordsEEG: true,
  params: {} as never,
  subject: 'P1',
  experimentObject: {} as never,
  group: 'A',
  session: 1,
  isEEGEnabled: true,
  connectionStatus: CONNECTION_STATUS.CONNECTED,
  ExperimentActions: { Stop, Start, SetSession: vi.fn() } as never,
};

describe('starting a run in a taken session', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('an ended-early session moves the run to the next free session and starts it', async () => {
    const actual = await vi.importActual<{
      nextFreeSession: typeof nextFreeSession;
    }>('../../../utils/filesystem/storage');
    vi.mocked(nextFreeSession).mockImplementationOnce(actual.nextFreeSession);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-run-'));
    const eeg = path.join(dir, 'Data/P1/EEG');
    fs.mkdirSync(eeg, { recursive: true });
    fs.writeFileSync(path.join(eeg, 'P1-A-1-raw.incomplete.csv'), 'x');
    const showMessageBox = vi.fn().mockResolvedValue({ response: 1 });
    vi.stubGlobal('electronAPI', {
      recordingExists: async (
        _title: string,
        subject: string,
        group: string,
        session: number
      ) => recordingExists(dir, subject, group, session),
      showMessageBox,
    });
    const Start = vi.fn();
    const SetSession = vi.fn();
    render(
      <Run
        {...props}
        isRunning={false}
        ExperimentActions={{ Start, SetSession } as never}
      />,
      { wrapper: MemoryRouter }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run & record' }));
    await screen.findByRole('dialog', { name: 'Press space to begin' });
    expect(showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({ buttons: ['Cancel', 'Record as session 2'] })
    );
    expect(SetSession).toHaveBeenCalledWith(2);

    fireEvent.keyDown(window, { code: 'Space' });
    fireEvent.keyDown(window, { code: 'Space' });
    expect(Start).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { code: 'Escape' });
    expect(screen.getByRole('heading', { name: 'Ready to run' })).toBeVisible();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('ending a run early', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps the partial run as incomplete and says it ended early', () => {
    const { rerender } = render(<Run {...props} />, { wrapper: MemoryRouter });

    rerender(<Run {...props} isEnding />);
    expect(Stop).toHaveBeenCalledWith({
      data: 'partial',
      outcome: 'incomplete',
    });

    rerender(<Run {...props} isRunning={false} runOutcome="incomplete" />);
    expect(
      screen.getByRole('heading', { name: 'Experiment ended early' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Recording complete/)).toBeNull();
  });

  it('a run that recorded no EEG recommends Analyze, even with EEG turned on', () => {
    render(
      <Run
        {...props}
        isRunning={false}
        runOutcome="complete"
        recordsEEG={false}
      />,
      { wrapper: MemoryRouter }
    );

    expect(
      screen.getByRole('button', { name: 'Analyze results →' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Clean this recording/)).toBeNull();
  });
});

describe('Ready card without a workspace', () => {
  afterEach(() => vi.clearAllMocks());
  const ready = { ...props, isRunning: false };
  const runButton = () => screen.getByRole('button', { name: 'Run & record' });

  it('cannot arm or start a run, and says why', () => {
    render(<Run {...ready} title="" params={null as never} />, {
      wrapper: MemoryRouter,
    });

    expect(runButton()).toBeDisabled();
    expect(screen.getByText(/No experiment is open/)).toBeInTheDocument();
    fireEvent.click(runButton());
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(Start).not.toHaveBeenCalled();
  });

  it('arms and starts a run when a workspace is open', async () => {
    render(<Run {...ready} />, { wrapper: MemoryRouter });

    expect(screen.queryByText(/No experiment is open/)).toBeNull();
    fireEvent.click(runButton());
    await screen.findByRole('dialog', { name: 'Press space to begin' });
    fireEvent.keyDown(window, { code: 'Space' });
    expect(Start).toHaveBeenCalledTimes(1);
  });
});
