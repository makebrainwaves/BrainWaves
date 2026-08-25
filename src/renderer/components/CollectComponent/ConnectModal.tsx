import { Observable } from 'rxjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isNil, debounce } from 'lodash';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import {
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS,
  DEVICES,
  SCREENS,
} from '../../constants/constants';
import {
  Device,
  DeviceInfo,
  SignalQualityData,
} from '../../constants/interfaces';
import { DeviceActions } from '../../actions';
import type { DiscoveredStream } from '../../../shared/lslTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  connectedDevice: DeviceInfo | null | undefined;
  signalQualityObservable?: Observable<SignalQualityData>;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceType: DEVICES;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<Device>;
  availableLSLStreams?: Array<DiscoveredStream>;
}

enum INSTRUCTION_PROGRESS {
  SEARCHING,
  TURN_ON,
}

function getDeviceName(device: Device | null) {
  if (device != null) {
    return device.name ?? device.id;
  }
  return '';
}

export default function ConnectModal(props: Props) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [instructionProgress, setInstructionProgress] = useState(
    INSTRUCTION_PROGRESS.SEARCHING
  );
  const [lslAvailable, setLslAvailable] = useState(false);

  const propsRef = useRef(props);
  propsRef.current = props;

  // Debounced handlers — recreate once, read current state via refs
  const selectedDeviceRef = useRef(selectedDevice);
  selectedDeviceRef.current = selectedDevice;

  const handleSearch = useMemo(
    () =>
      debounce(
        function handleSearch() {
          setInstructionProgress(0);
          propsRef.current.DeviceActions.SetDeviceAvailability(
            DEVICE_AVAILABILITY.SEARCHING
          );
        },
        300,
        { leading: true, trailing: false }
      ),
    []
  );

  const handleConnect = useMemo(
    () =>
      debounce(
        function handleConnect() {
          const device = selectedDeviceRef.current;
          if (device) {
            propsRef.current.DeviceActions.ConnectToDevice(device);
          }
        },
        1000,
        { leading: true, trailing: false }
      ),
    []
  );

  useEffect(
    () => () => {
      handleSearch.cancel();
      handleConnect.cancel();
    },
    [handleSearch, handleConnect]
  );

  // Mount: check LSL availability
  useEffect(() => {
    window.electronAPI
      ?.isLSLAvailable?.()
      .then((ok) => setLslAvailable(ok))
      .catch(() => setLslAvailable(false));
  }, []);

  // UNSAFE_componentWillUpdate → useEffect with prevAvailability ref.
  // Class version fires BEFORE render; useEffect fires AFTER.
  // Accept the one-frame delay — the semantics (transitioning between
  // deviceAvailability values) is unaffected for the user.
  const prevAvailability = useRef(props.deviceAvailability);
  useEffect(() => {
    const prev = prevAvailability.current;
    prevAvailability.current = props.deviceAvailability;
    if (
      props.deviceAvailability === DEVICE_AVAILABILITY.NONE &&
      prev === DEVICE_AVAILABILITY.SEARCHING
    ) {
      setInstructionProgress(INSTRUCTION_PROGRESS.TURN_ON);
    }
    if (
      props.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE &&
      prev === DEVICE_AVAILABILITY.NONE
    ) {
      setInstructionProgress(INSTRUCTION_PROGRESS.SEARCHING);
    }
  }, [props.deviceAvailability]);

  function handleDiscoverLSLStreams() {
    props.DeviceActions.DiscoverLSLStreams();
  }

  function handleConnectLSLStream(stream: DiscoveredStream) {
    props.DeviceActions.ConnectToLSLStream(stream);
  }

  function handleinstructionProgress(progress: INSTRUCTION_PROGRESS) {
    if (progress !== 0) {
      setInstructionProgress(progress);
    }
  }

  function renderLSLDiscovery() {
    const streams = props.availableLSLStreams ?? [];
    const eegStreams = streams.filter((s) => s.type === 'EEG');
    return (
      <div className="mb-3 text-left">
        <Button
          variant="secondary"
          className="w-full mb-2"
          onClick={handleDiscoverLSLStreams}
        >
          Scan for LSL streams
        </Button>
        {eegStreams.length === 0 ? (
          <p className="text-sm text-gray-500">No LSL EEG streams found yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 text-sm">
            {eegStreams.map((stream) => (
              <li
                key={stream.uid}
                className="flex justify-between items-center py-2"
              >
                <span>
                  {stream.name} — {stream.channelCount}ch @ {stream.sampleRate}
                  Hz
                </span>
                <Button
                  variant="default"
                  onClick={() => handleConnectLSLStream(stream)}
                >
                  Connect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  function renderAvailableDeviceList() {
    return (
      <ul role="listbox" className="divide-y divide-gray-200">
        {props.availableDevices.map((device) => (
          <li
            key={device.id}
            role="option"
            aria-selected={selectedDevice === device}
            tabIndex={0}
            className="flex items-center gap-2 py-2 cursor-pointer text-lg"
            onClick={() => setSelectedDevice(device)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedDevice(device)}
          >
            <span>{selectedDevice === device ? '✓' : '○'}</span>
            <span>{getDeviceName(device)}</span>
          </li>
        ))}
      </ul>
    );
  }

  function renderContent() {
    if (props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING) {
      return (
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner size={32} />
          <p className="text-center">Searching for available headset(s)...</p>
        </div>
      );
    }
    if (props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      return (
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner size={32} />
          <p className="text-center">
            Connecting to {getDeviceName(selectedDevice)}...
          </p>
        </div>
      );
    }
    if (instructionProgress === INSTRUCTION_PROGRESS.TURN_ON) {
      return (
        <>
          <h2>Turn your headset on</h2>
          <div className="mb-3 text-left">
            <label className="block text-sm font-medium mb-1">
              Device type
            </label>
            <select
              value={props.deviceType}
              onChange={(e) =>
                props.DeviceActions.SetDeviceType(e.target.value as DEVICES)
              }
              className="w-full rounded border px-2 py-1"
            >
              <option value={DEVICES.MUSE}>Muse</option>
              <option value={DEVICES.NEUROSITY}>Neurosity Crown</option>
              {lslAvailable && (
                <option value={DEVICES.LSL}>External LSL stream</option>
              )}
              {import.meta.env.DEV && (
                <option value={DEVICES.FIXTURE}>Fixture (Synthetic EEG)</option>
              )}
            </select>
          </div>
          {props.deviceType === DEVICES.FIXTURE ? (
            <p>
              Fixture mode replays a recorded EEG sample. No headset needed.
            </p>
          ) : props.deviceType === DEVICES.LSL ? (
            renderLSLDiscovery()
          ) : (
            <>
              <p>Make sure your headset is on and fully charged.</p>
              <p>
                If the headset needs charging, set the power switch to off and
                plug in the headset. <b>Do not charge the headset while wearing it</b>
              </p>
            </>
          )}
          <div className="flex gap-2 mt-4">
            {(instructionProgress as number) !== 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleinstructionProgress(0)}
              >
                Back
              </Button>
            )}
            <Button variant="default" className="w-full" onClick={handleSearch}>
              Next
            </Button>
          </div>
        </>
      );
    }
    if (props.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE) {
      return (
        <>
          <h2>Headset(s) found</h2>
          <p>Please select which headset you would like to connect.</p>
          {renderAvailableDeviceList()}
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleinstructionProgress(1)}
            >
              Back
            </Button>
            <Button
              variant="default"
              className="w-full"
              disabled={isNil(selectedDevice)}
              onClick={handleConnect}
            >
              Connect
            </Button>
          </div>
          <a
            role="link"
            tabIndex={0}
            className="block mt-2 text-sm cursor-pointer"
            onClick={() => handleinstructionProgress(1)}
          >
            Don&#39;t see your device?
          </a>
        </>
      );
    }
    return null;
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-w-sm text-center">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
