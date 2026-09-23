import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../../constants/constants';
import { HeadsetSetupContext } from '../../../containers/AppShellContainer';
import Collect, { Props as CollectProps } from '../index';

const mockSetDeviceAvailability = vi.fn();
const openHeadsetSetup = vi.fn();

vi.mock('lab.js', () => ({}));

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HeadsetSetupContext.Provider value={{ openHeadsetSetup }}>
    {children}
  </HeadsetSetupContext.Provider>
);
const renderCollect = (overrides: Partial<CollectProps> = {}) =>
  render(
    <Collect {...(baseProps as unknown as CollectProps)} {...overrides} />,
    { wrapper }
  );

describe('Collect headset setup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens headset setup on arrival without starting a Bluetooth search', () => {
    renderCollect();

    expect(openHeadsetSetup).toHaveBeenCalled();
    expect(mockSetDeviceAvailability).not.toHaveBeenCalledWith(
      DEVICE_AVAILABILITY.SEARCHING
    );
  });

  it('does not open headset setup when EEG is disabled', () => {
    renderCollect({ isEEGEnabled: false });

    expect(openHeadsetSetup).not.toHaveBeenCalled();
  });

  it('reopens headset setup when a connected headset drops', () => {
    const { rerender } = renderCollect({
      connectionStatus: CONNECTION_STATUS.CONNECTED,
    });
    expect(openHeadsetSetup).not.toHaveBeenCalled();

    rerender(
      <Collect
        {...(baseProps as unknown as CollectProps)}
        connectionStatus={CONNECTION_STATUS.NOT_YET_CONNECTED}
      />
    );

    expect(openHeadsetSetup).toHaveBeenCalled();
    expect(mockSetDeviceAvailability).not.toHaveBeenCalledWith(
      DEVICE_AVAILABILITY.SEARCHING
    );
  });
});
