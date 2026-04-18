import { Observable } from 'rxjs';
import React, { Component } from 'react';
import { isNil, debounce } from 'lodash';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import {
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS,
  DEVICES,
  SCREENS,
} from '../../constants/constants';
import { Device, SignalQualityData } from '../../constants/interfaces';
import { DeviceActions } from '../../actions';
import type { DiscoveredStream } from '../../../shared/lslTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  connectedDevice: Record<string, unknown>;
  signalQualityObservable?: Observable<SignalQualityData>;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceType: DEVICES;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<Device>;
  availableLSLStreams?: Array<DiscoveredStream>;
}

interface State {
  selectedDevice: Device | null;
  instructionProgress: INSTRUCTION_PROGRESS;
}

enum INSTRUCTION_PROGRESS {
  SEARCHING,
  TURN_ON,
  COMPUTER_CONNECTABILITY,
}

export default class ConnectModal extends Component<Props, State> {
  static getDeviceName(device: Device | null) {
    if (device != null) {
      return device.name ?? device.id;
    }
    return '';
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedDevice: null,
      instructionProgress: INSTRUCTION_PROGRESS.SEARCHING,
    };
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false,
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 1000, {
      leading: true,
      trailing: false,
    });
    this.handleinstructionProgress = this.handleinstructionProgress.bind(this);
  }

  UNSAFE_componentWillUpdate(nextProps: Props) {
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.NONE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ) {
      this.setState({ instructionProgress: 1 });
    }
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.NONE
    ) {
      this.setState({ instructionProgress: 0 });
    }
  }

  handleSearch() {
    this.setState({ instructionProgress: 0 });
    this.props.DeviceActions.SetDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    if (this.state.selectedDevice) {
      this.props.DeviceActions.ConnectToDevice(this.state.selectedDevice);
    }
  }

  handleDiscoverLSLStreams = () => {
    this.props.DeviceActions.DiscoverLSLStreams();
  };

  handleConnectLSLStream = (stream: DiscoveredStream) => {
    this.props.DeviceActions.ConnectToLSLStream(stream);
  };

  handleinstructionProgress(progress: INSTRUCTION_PROGRESS) {
    if (progress !== 0) {
      this.setState({ instructionProgress: progress });
    }
  }

  renderLSLDiscovery() {
    const streams = this.props.availableLSLStreams ?? [];
    const eegStreams = streams.filter((s) => s.type === 'EEG');
    return (
      <div className="mb-3 text-left">
        <Button
          variant="secondary"
          className="w-full mb-2"
          onClick={this.handleDiscoverLSLStreams}
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
                  {stream.name} — {stream.channelCount}ch @ {stream.sampleRate}Hz
                </span>
                <Button
                  variant="default"
                  onClick={() => this.handleConnectLSLStream(stream)}
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

  renderAvailableDeviceList() {
    return (
      <ul role="listbox" className="divide-y divide-gray-200">
        {this.props.availableDevices.map((device) => (
          <li
            key={device.id}
            role="option"
            aria-selected={this.state.selectedDevice === device}
            tabIndex={0}
            className="flex items-center gap-2 py-2 cursor-pointer text-lg"
            onClick={() => this.setState({ selectedDevice: device })}
            onKeyDown={(e) => e.key === 'Enter' && this.setState({ selectedDevice: device })}
          >
            <span>{this.state.selectedDevice === device ? '✓' : '○'}</span>
            <span>{ConnectModal.getDeviceName(device)}</span>
          </li>
        ))}
      </ul>
    );
  }

  renderContent() {
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING) {
      return (
        <p className="text-center">Searching for available headset(s)...</p>
      );
    }
    if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      return (
        <p className="text-center">
          Connecting to {ConnectModal.getDeviceName(this.state.selectedDevice)}
          ...
        </p>
      );
    }
    if (this.state.instructionProgress === INSTRUCTION_PROGRESS.TURN_ON) {
      return (
        <>
          <h2>Turn your headset on</h2>
          <div className="mb-3 text-left">
            <label className="block text-sm font-medium mb-1">
              Device type
            </label>
            <select
              value={this.props.deviceType}
              onChange={(e) =>
                this.props.DeviceActions.SetDeviceType(
                  e.target.value as DEVICES
                )
              }
              className="w-full rounded border px-2 py-1"
            >
              <option value={DEVICES.MUSE}>Muse</option>
              <option value={DEVICES.NEUROSITY}>Neurosity Crown</option>
              <option value={DEVICES.LSL}>External LSL stream</option>
            </select>
          </div>
          {this.props.deviceType === DEVICES.LSL && this.renderLSLDiscovery()}
          <p>Make sure your headset is on and fully charged.</p>
          <p>
            If the headset needs charging, set the power switch to off and plug
            in the headset. <b>Do not charge the headset while wearing it</b>
          </p>
          <div className="flex gap-2 mt-4">
            {(this.state.instructionProgress as number) !== 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => this.handleinstructionProgress(0)}
              >
                Back
              </Button>
            )}
            <Button
              variant="default"
              className="w-full"
              onClick={() =>
                this.handleinstructionProgress(
                  INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY
                )
              }
            >
              Next
            </Button>
          </div>
        </>
      );
    }
    if (
      this.state.instructionProgress ===
      INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY
    ) {
      return (
        <>
          <h2>Insert the USB Receiver</h2>
          <p>
            Insert the USB receiver into a USB port on your computer. Ensure
            that the LED on the receiver is continously lit or flickering
            rapidly. If it is blinking slowly or not illuminated, remove and
            reinsert the receiver
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                this.handleinstructionProgress(INSTRUCTION_PROGRESS.TURN_ON)
              }
            >
              Back
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={this.handleSearch}
            >
              Next
            </Button>
          </div>
        </>
      );
    }
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE) {
      return (
        <>
          <h2>Headset(s) found</h2>
          <p>Please select which headset you would like to connect.</p>
          {this.renderAvailableDeviceList()}
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => this.handleinstructionProgress(1)}
            >
              Back
            </Button>
            <Button
              variant="default"
              className="w-full"
              disabled={isNil(this.state.selectedDevice)}
              onClick={this.handleConnect}
            >
              Connect
            </Button>
          </div>
          <a
            role="link"
            tabIndex={0}
            className="block mt-2 text-sm cursor-pointer"
            onClick={() => this.handleinstructionProgress(1)}
          >
            Don&#39;t see your device?
          </a>
        </>
      );
    }
    return null;
  }

  render() {
    return (
      <Dialog
        open={this.props.open}
        onOpenChange={(open) => {
          if (!open) this.props.onClose();
        }}
      >
        <DialogContent className="max-w-sm text-center">
          {this.renderContent()}
        </DialogContent>
      </Dialog>
    );
  }
}
