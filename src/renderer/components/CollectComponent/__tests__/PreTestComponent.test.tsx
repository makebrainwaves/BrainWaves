import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
  EXPERIMENTS,
} from '../../../constants/constants';
import PreTestComponent from '../PreTestComponent';

vi.mock('lab.js', () => ({}));
vi.mock('../../ViewerComponent', () => ({ default: () => null }));
vi.mock('../../SignalQualityIndicatorComponent', () => ({
  default: () => null,
}));
vi.mock('../../PreviewExperimentComponent', () => ({
  default: () => <div data-testid="preview" />,
}));
vi.mock('../../../utils/labjs/functions', () => ({
  getExperimentFromType: () => ({}),
}));

const openRunComponent = vi.fn();
const props = {
  ExperimentActions: {} as never,
  DeviceActions: {} as never,
  connectedDevice: null,
  signalQualityObservable: null,
  deviceAvailability: DEVICE_AVAILABILITY.AVAILABLE,
  connectionStatus: CONNECTION_STATUS.CONNECTED,
  deviceType: DEVICES.MUSE,
  availableDevices: [],
  type: EXPERIMENTS.N170,
  isRunning: false,
  params: {} as never,
  subject: 'P1',
  group: 'A',
  session: 1,
  title: 'Study',
  openRunComponent,
};

const previewButton = () =>
  screen.getByRole('button', { name: 'Preview experiment' });
const runButton = () => screen.getByRole('button', { name: 'Run & record' });

describe('Collect pre-run actions', () => {
  afterEach(() => vi.clearAllMocks());

  it('are off without a workspace, and say why', () => {
    render(<PreTestComponent {...props} title="" params={null as never} />);

    expect(previewButton()).toBeDisabled();
    expect(runButton()).toBeDisabled();
    expect(screen.getByText(/No experiment is open/)).toBeInTheDocument();
    fireEvent.click(previewButton());
    fireEvent.click(runButton());
    expect(screen.queryByTestId('preview')).toBeNull();
    expect(openRunComponent).not.toHaveBeenCalled();
  });

  it('preview and run when a workspace is open', () => {
    render(<PreTestComponent {...props} />);

    expect(screen.queryByText(/No experiment is open/)).toBeNull();
    fireEvent.click(runButton());
    expect(openRunComponent).toHaveBeenCalledTimes(1);
    fireEvent.click(previewButton());
    expect(screen.getByTestId('preview')).toBeInTheDocument();
  });
});
