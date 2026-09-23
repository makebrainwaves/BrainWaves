import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogOverlay, DialogPortal } from '../ui/dialog';
import HeadsetSetup, { FoundHeadset, SetupDevice } from './HeadsetSetup';
import { pairingStep, SetupScreen } from './pairingStep';
import { DeviceActions } from '../../actions';
import {
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import { RootState } from '../../store';

/** Model line shown under each discovered Bluetooth device. */
const MODEL: Record<Exclude<SetupDevice, DEVICES.LSL>, string> = {
  [DEVICES.MUSE]: 'Muse headset',
  [DEVICES.NEUROSITY]: 'Neurosity Crown',
  [DEVICES.FIXTURE]: 'Synthetic EEG replay',
};

interface Props {
  open: boolean;
  onClose(): void;
  /** "Check my signal" pressed on the Connected screen. */
  onDone(device: SetupDevice): void;
}

/**
 * Live pairing dialog around the approved `HeadsetSetup` view. The student's
 * own screens (choose → wear → ready) are local; once they press search,
 * Redux device state picks the screen via `pairingStep`. Closing while
 * searching or connecting cancels that attempt.
 */
export default function HeadsetSetupDialog({ open, onClose, onDone }: Props) {
  const dispatch = useDispatch();
  const {
    availableDevices,
    availableLSLStreams,
    connectionStatus,
    deviceAvailability,
    deviceType,
  } = useSelector((s: RootState) => s.device);
  const [device, setDevice] = useState<SetupDevice>();
  const [screen, setScreen] = useState<SetupScreen>('choose');
  const [selectedId, setSelectedId] = useState<string>();
  const [lslSearching, setLslSearching] = useState(false);
  const [showLSL, setShowLSL] = useState(false);

  useEffect(() => {
    window.electronAPI
      ?.isLSLAvailable?.()
      .then(setShowLSL)
      .catch(() => setShowLSL(false));
  }, []);

  useEffect(() => {
    if (open) {
      setScreen('choose');
      setSelectedId(undefined);
    }
  }, [open]);

  useEffect(() => setLslSearching(false), [availableLSLStreams]);

  const connected = connectionStatus === CONNECTION_STATUS.CONNECTED;
  const shownDevice = connected ? (deviceType as SetupDevice) : device;
  const isLSL = shownDevice === DEVICES.LSL;
  const found: FoundHeadset[] = isLSL
    ? availableLSLStreams
        .filter((s) => s.type === 'EEG')
        .map((s) => ({
          id: s.uid,
          name: s.name,
          model: `${s.channelCount} channels at ${s.sampleRate} Hz`,
        }))
    : availableDevices.map((d) => ({
        id: d.id,
        name: d.name ?? d.id,
        model: shownDevice ? MODEL[shownDevice as keyof typeof MODEL] : '',
      }));
  const step = pairingStep({
    screen,
    isLSL,
    availability: deviceAvailability,
    connectionStatus,
    lslSearching,
    foundCount: found.length,
  });

  /**
   * Starts discovery. Must stay synchronous: Web Bluetooth's requestDevice()
   * only runs inside the click that dispatched SEARCHING.
   */
  function find() {
    if (!device) return;
    setSelectedId(undefined);
    setScreen('discovery');
    if (device === DEVICES.LSL) {
      setLslSearching(true);
      dispatch(DeviceActions.DiscoverLSLStreams());
      return;
    }
    if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
      dispatch(
        DeviceActions.SetConnectionStatus(CONNECTION_STATUS.NOT_YET_CONNECTED)
      );
    }
    dispatch(DeviceActions.SetDeviceType(device));
    dispatch(DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING));
  }

  /** Stops the current search or connect and returns to the last manual screen. */
  function cancel() {
    if (step === 'searching' && !isLSL) dispatch(DeviceActions.CancelSearch());
    if (step === 'connecting') dispatch(DeviceActions.DisconnectFromDevice());
    setLslSearching(false);
    setScreen(
      device === DEVICES.MUSE || device === DEVICES.NEUROSITY ? 'ready' : 'wear'
    );
  }

  function close() {
    if (step === 'searching' || step === 'connecting') cancel();
    onClose();
  }

  function connect() {
    if (isLSL) {
      const stream = availableLSLStreams.find((s) => s.uid === selectedId);
      if (stream) dispatch(DeviceActions.ConnectToLSLStream(stream));
      return;
    }
    const target = availableDevices.find((d) => d.id === selectedId);
    if (target) dispatch(DeviceActions.ConnectToDevice(target));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Headset setup
          </DialogPrimitive.Title>
          <HeadsetSetup
            step={step}
            device={shownDevice}
            found={found}
            selectedId={selectedId}
            showFixture={import.meta.env.DEV}
            showLSL={showLSL}
            onChooseDevice={(d) => {
              setDevice(d);
              setScreen('wear');
            }}
            onBack={() => setScreen(screen === 'wear' ? 'choose' : 'wear')}
            onContinue={() => setScreen('ready')}
            onFindHeadset={find}
            onCancel={cancel}
            onSelectHeadset={(id) =>
              setSelectedId(selectedId === id ? undefined : id)
            }
            onConnect={connect}
            onStartSoftwareSource={find}
            onDone={() => shownDevice && onDone(shownDevice)}
            onClose={close}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
