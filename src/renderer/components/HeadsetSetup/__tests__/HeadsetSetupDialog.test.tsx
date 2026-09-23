import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeviceActions } from '../../../actions';
import { DEVICE_AVAILABILITY, DEVICES } from '../../../constants/constants';
import HeadsetSetupDialog from '../HeadsetSetupDialog';

const store = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: {
    device: {
      availableDevices: [],
      availableLSLStreams: [],
      connectionStatus: 'NOT_YET_CONNECTED',
      deviceAvailability: 'NONE',
      deviceType: 'MUSE',
    },
  },
}));
vi.mock('react-redux', () => ({
  useDispatch: () => store.dispatch,
  useSelector: (select: (s: unknown) => unknown) => select(store.state),
}));

describe('HeadsetSetupDialog', () => {
  it('searches only when asked, and closing mid-search cancels the platform search', () => {
    const onClose = vi.fn();
    const ui = () => (
      <HeadsetSetupDialog open onClose={onClose} onDone={vi.fn()} />
    );
    const { rerender } = render(ui());

    fireEvent.click(screen.getByRole('button', { name: 'Muse' }));
    fireEvent.click(screen.getByRole('button', { name: 'It’s on' }));
    expect(store.dispatch).not.toHaveBeenCalledWith(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Find my headset' }));
    expect(store.dispatch).toHaveBeenCalledWith(
      DeviceActions.SetDeviceType(DEVICES.MUSE)
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );

    store.state.device.deviceAvailability = DEVICE_AVAILABILITY.SEARCHING;
    rerender(ui());
    expect(screen.getByText(/Looking for your Muse/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close setup' }));
    expect(store.dispatch).toHaveBeenCalledWith(DeviceActions.CancelSearch());
    expect(onClose).toHaveBeenCalled();
  });
});
