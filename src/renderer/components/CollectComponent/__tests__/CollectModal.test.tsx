import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../../constants/constants';
import Collect, { Props as CollectProps } from '../index';

const mockSetDeviceAvailability = vi.fn();

vi.mock('lab.js', () => ({}));

vi.mock('../ConnectModal', () => ({
  default: (props: { open: boolean }) =>
    props.open ? <div data-testid="connect-modal">ConnectModal</div> : null,
}));

vi.mock('../PreTestComponent', () => ({
  default: () => <div data-testid="pretest">PreTest</div>,
}));

vi.mock('../RunComponent', () => ({
  default: () => <div data-testid="run">Run</div>,
}));

const baseProps: Record<string, unknown> = {
  ExperimentActions: {
    Stop: vi.fn(),
    SetIsRunning: vi.fn(),
    SetSubject: vi.fn(),
    StartCustomExperiment: vi.fn(),
  },
  DeviceActions: {
    ConnectToDevice: vi.fn(),
    DisconnectFromDevice: vi.fn(),
    SetDeviceAvailability: mockSetDeviceAvailability,
    SetDeviceType: vi.fn(),
    DiscoverLSLStreams: vi.fn(),
    ConnectToLSLStream: vi.fn(),
  },
  connectedDevice: null,
  deviceAvailability: DEVICE_AVAILABILITY.NONE,
  connectionStatus: CONNECTION_STATUS.DISCONNECTED,
  deviceType: DEVICES.MUSE,
  availableDevices: [],
  availableLSLStreams: [],
  type: 'Faces_and_Houses' as const,
  experimentObject: {},
  signalQualityObservable: undefined,
  isRunning: false,
  params: null,
  subject: '',
  group: '',
  session: 0,
  isEEGEnabled: true,
  title: 'Test',
};

describe('Collect modal', () => {
  it('opens the connect modal on mount when EEG is enabled and not connected', () => {
    render(<Collect {...(baseProps as unknown as CollectProps)} />);

    expect(screen.getByTestId('connect-modal')).toBeInTheDocument();
    expect(mockSetDeviceAvailability).toHaveBeenCalledWith(
      DEVICE_AVAILABILITY.SEARCHING
    );
  });

  it('does not open the connect modal on mount when EEG is disabled', () => {
    render(
      <Collect
        {...(baseProps as unknown as CollectProps)}
        isEEGEnabled={false}
      />
    );

    expect(screen.queryByTestId('connect-modal')).not.toBeInTheDocument();
  });

  it('closes the connect modal when connection status changes to CONNECTED', () => {
    const { rerender } = render(
      <Collect {...(baseProps as unknown as CollectProps)} />
    );
    expect(screen.getByTestId('connect-modal')).toBeInTheDocument();

    rerender(
      <Collect
        {...(baseProps as unknown as CollectProps)}
        connectionStatus={CONNECTION_STATUS.CONNECTED}
      />
    );

    expect(screen.queryByTestId('connect-modal')).not.toBeInTheDocument();
  });
});
