import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONNECTION_STATUS, EXPERIMENTS } from '../../../constants/constants';
import { EndRunContext } from '../../../containers/AppShellContainer';
import Run from '../RunComponent';

type RuntimeProps = {
  onFinish(csv: string): void;
  onAbort?(csv: string): void;
};

const runtime = vi.hoisted(() => ({ props: null as null | RuntimeProps }));

vi.mock('lab.js', () => ({}));
vi.mock('../../ExperimentRuntime', async () => {
  // vi.mock factories are hoisted above static imports, so React is loaded here.
  const { useEffect } = await import('react');
  return {
    ExperimentRuntime: (props: RuntimeProps) => {
      runtime.props = props;
      useEffect(() => () => props.onAbort?.('partial'), [props]);
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
  params: {} as never,
  subject: 'P1',
  experimentObject: {} as never,
  group: 'A',
  session: 1,
  isEEGEnabled: true,
  connectionStatus: CONNECTION_STATUS.CONNECTED,
  ExperimentActions: { Stop, Start: vi.fn(), SetSession: vi.fn() } as never,
};

let endRun: (() => void) | null = null;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <EndRunContext.Provider
      value={(end) => {
        endRun = end;
      }}
    >
      {children}
    </EndRunContext.Provider>
  </MemoryRouter>
);

describe('ending a run early', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    endRun = null;
  });

  it('keeps the partial run as incomplete and says it ended early', () => {
    const { rerender } = render(<Run {...props} />, { wrapper });

    act(() => endRun!());
    expect(Stop).toHaveBeenCalledWith({
      data: 'partial',
      outcome: 'incomplete',
    });

    rerender(<Run {...props} isRunning={false} />);
    expect(
      screen.getByRole('heading', { name: 'Experiment ended early' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Recording complete/)).toBeNull();
  });

  it('a tap of Escape never ends the run; holding it does', () => {
    vi.useFakeTimers();
    render(<Run {...props} />, { wrapper });

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.keyUp(window, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(Stop).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(Stop).toHaveBeenCalledWith({
      data: 'partial',
      outcome: 'incomplete',
    });
  });

  it('a run that finishes as it is ended early is recorded once, as complete', () => {
    render(<Run {...props} />, { wrapper });

    act(() => runtime.props!.onFinish('full'));
    act(() => endRun!());

    expect(Stop).toHaveBeenCalledTimes(1);
    expect(Stop).toHaveBeenCalledWith({ data: 'full', outcome: 'complete' });
  });

  it('a late report from an earlier run never ends the next one', () => {
    const { rerender } = render(<Run {...props} />, { wrapper });
    const firstRun = runtime.props!;
    act(() => firstRun.onAbort!('first'));
    rerender(<Run {...props} isRunning={false} />);
    rerender(<Run {...props} isRunning />);

    act(() => firstRun.onAbort!('late'));
    act(() => firstRun.onFinish('late'));

    expect(Stop).toHaveBeenCalledTimes(1);
    act(() => runtime.props!.onFinish('second'));
    expect(Stop).toHaveBeenLastCalledWith({
      data: 'second',
      outcome: 'complete',
    });
  });
});
