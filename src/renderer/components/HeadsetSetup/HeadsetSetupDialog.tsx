import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogOverlay, DialogPortal } from '../ui/dialog';
import HeadsetSetup, { FoundHeadset, SetupDevice } from './HeadsetSetup';
import { pairingStep, SetupScreen } from './pairingStep';
import { DeviceActions } from '../../actions';
import { DEVICE_AVAILABILITY, DEVICES } from '../../constants/constants';
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
  /** "Check my signal" pressed on the Connected screen; `onClose` follows. */
  onDone(device: SetupDevice): void;
}

/**
 * Live pairing dialog around the approved `HeadsetSetup` view. Only the
 * student's place in the manual screens (choose → wear → ready) and their row
 * pick are local; the device type and every search/connect state live in
 * Redux, and `pairingStep` maps them to the screen. Closing while searching or
 * connecting cancels that attempt.
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
  const device = deviceType as SetupDevice;
  const [screen, setScreen] = useState<SetupScreen>('choose');
  const [selectedId, setSelectedId] = useState<string>();
  const [showLSL, setShowLSL] = useState(false);

  useEffect(() => {
    window.electronAPI
      ?.isLSLAvailable?.()
      .then(setShowLSL)
      .catch(() => setShowLSL(false));
  }, []);

  const isLSL = device === DEVICES.LSL;
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
        model: MODEL[device as keyof typeof MODEL] ?? '',
      }));
  const step = pairingStep({
    screen,
    availability: deviceAvailability,
    connectionStatus,
    foundCount: found.length,
  });

  /**
   * Starts discovery. Must stay synchronous: Web Bluetooth's requestDevice()
   * only runs inside the click that dispatched SEARCHING.
   */
  function find() {
    setSelectedId(undefined);
    setScreen('discovery');
    dispatch(
      isLSL
        ? DeviceActions.DiscoverLSLStreams()
        : DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING)
    );
  }

  /** Stops the current search or connect and returns to the last manual screen. */
  function cancel() {
    if (step === 'searching') dispatch(DeviceActions.CancelSearch());
    if (step === 'connecting') dispatch(DeviceActions.DisconnectFromDevice());
    setScreen(
      device === DEVICES.MUSE || device === DEVICES.NEUROSITY ? 'ready' : 'wear'
    );
  }

  /** Every exit: cancels a pending attempt so the next open starts at "Which headset?". */
  function close() {
    if (step === 'searching' || step === 'connecting') cancel();
    setScreen('choose');
    setSelectedId(undefined);
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
            device={device}
            found={found}
            selectedId={selectedId}
            showFixture={import.meta.env.DEV}
            showLSL={showLSL}
            onChooseDevice={(d) => {
              dispatch(DeviceActions.SetDeviceType(d));
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
            onDone={() => {
              onDone(device);
              close();
            }}
            onClose={close}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
