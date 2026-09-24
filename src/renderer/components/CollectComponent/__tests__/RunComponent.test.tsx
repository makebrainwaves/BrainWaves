import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONNECTION_STATUS, EXPERIMENTS } from '../../../constants/constants';
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

const Stop = vi.fn();
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
  ExperimentActions: { Stop, Start: vi.fn(), SetSession: vi.fn() } as never,
};

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
