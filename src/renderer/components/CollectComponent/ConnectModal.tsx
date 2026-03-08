import { Observable } from 'rxjs';
import React, { Component } from 'react';
import { isNil, debounce } from 'lodash';

import {
  DEVICES,
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS,
  SCREENS,
} from '../../constants/constants';
import styles from '../styles/collect.module.css';
import { SignalQualityData } from '../../constants/interfaces';
import { DeviceActions } from '../../actions';

interface Props {
  history: { push: (path: string) => void };
  open: boolean;
  onClose: () => void;
  connectedDevice: Record<string, any>;
  signalQualityObservable?: Observable<SignalQualityData>;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<any>;
}

interface State {
  selectedDevice: any;
  instructionProgress: INSTRUCTION_PROGRESS;
}

enum INSTRUCTION_PROGRESS {
  SEARCHING,
  TURN_ON,
  COMPUTER_CONNECTABILITY,
}

export default class ConnectModal extends Component<Props, State> {
  // handleSearch: () => void;

  // handleStartTutorial: () => void;
  static getDeviceName(device: any) {
    if (!isNil(device)) {
      return isNil(device.name) ? device.id : device.name;
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
    // Replicate Modal's onOpen: trigger handleSearch when modal transitions to open
    if (nextProps.open && !this.props.open) {
      this.handleSearch();
    }
  }

  handleSearch() {
    this.setState({ instructionProgress: 0 });
    this.props.DeviceActions.SetDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.DeviceActions.ConnectToDevice(this.state.selectedDevice);
  }

  handleinstructionProgress(progress: INSTRUCTION_PROGRESS) {
    if (progress !== 0) {
      this.setState({ instructionProgress: progress });
    }
  }

  renderAvailableDeviceList() {
    return (
      <div>
        <ul className="divide-y divide-gray-200">
          {this.props.availableDevices.map((device) => (
            <li className={`${styles.deviceItem} flex items-center gap-3 py-2`} key={device.id}>
              <button
                className="text-gray-500 hover:text-blue-600 focus:outline-none"
                onClick={() => this.setState({ selectedDevice: device })}
                aria-label="Select device"
              >
                {this.state.selectedDevice === device ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  </svg>
                )}
              </button>
              <span>{ConnectModal.getDeviceName(device)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  renderContent() {
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING) {
      return (
        <>
          <div className={styles.searchingText}>
            Searching for available headset(s)...
          </div>
        </>
      );
    }
    if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      return (
        <>
          <div className={styles.searchingText}>
            Connecting to{' '}
            {ConnectModal.getDeviceName(this.state.selectedDevice)}
            ...
          </div>
        </>
      );
    }
    if (this.state.instructionProgress === INSTRUCTION_PROGRESS.TURN_ON) {
      return (
        <>
          <h2 className={`text-xl font-semibold ${styles.connectHeader}`}>
            Turn your headset on
          </h2>
          <div className="mb-4">
            Make sure your headset is on and fully charged.
            <p />
            If the headset needs charging, set the power switch to off and plug
            in the headset. <b>Do not charge the headset while wearing it</b>
          </div>
          <div className="mb-4">
            <div className="flex w-full gap-4 text-center">
              <div className="flex-1">
                {(this.state.instructionProgress as number) !== 0 && (
                  <button
                    className={`w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium ${styles.secondaryButton}`}
                    onClick={() => this.handleinstructionProgress(0)}
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex-1">
                <button
                  className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium ${styles.primaryButton}`}
                  onClick={() =>
                    this.handleinstructionProgress(
                      INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
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
          <h2 className={`text-xl font-semibold ${styles.connectHeader}`}>
            Insert the USB Receiver
          </h2>
          <div className="mb-4">
            Insert the USB receiver into a USB port on your computer. Ensure
            that the LED on the receiver is continously lit or flickering
            rapidly. If it is blinking slowly or not illuminated, remove and
            reinsert the receiver
          </div>
          <div className="mb-4">
            <div className="flex w-full gap-4 text-center">
              <div className="flex-1">
                <button
                  className={`w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium ${styles.secondaryButton}`}
                  onClick={() =>
                    this.handleinstructionProgress(INSTRUCTION_PROGRESS.TURN_ON)
                  }
                >
                  Back
                </button>
              </div>
              <div className="flex-1">
                <button
                  className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium ${styles.primaryButton}`}
                  onClick={this.handleSearch}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE) {
      return (
        <>
          <h2 className={`text-xl font-semibold ${styles.connectHeader}`}>
            Headset(s) found
          </h2>
          <div className="mb-4">
            Please select which headset you would like to connect.
          </div>
          <div className="mb-4">{this.renderAvailableDeviceList()}</div>
          <div className="my-4 border-t border-gray-200" />
          <div className="mb-4">
            <div className="flex w-full gap-4 text-center">
              <div className="flex-1">
                <button
                  className={`w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium ${styles.secondaryButton}`}
                  onClick={() => this.handleinstructionProgress(1)}
                >
                  Back
                </button>
              </div>
              <div className="flex-1">
                <button
                  className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles.primaryButton}`}
                  disabled={isNil(this.state.selectedDevice)}
                  onClick={this.handleConnect}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <a
              role="link"
              tabIndex={0}
              onClick={() => this.handleinstructionProgress(1)}
            >
              Don&#39;t see your device?
            </a>
          </div>
        </>
      );
    }
    return <></>;
  }

  render() {
    if (!this.props.open) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={this.props.onClose}
        />
        <div
          className={`relative z-50 ${styles.connectModal}`}
        >
          <button
            className={`absolute top-2 right-2 rounded-full bg-transparent border-0 text-white text-xl leading-none p-2 hover:bg-white/20 transition-colors ${styles.modalCloseButton}`}
            onClick={this.props.onClose}
            aria-label="Close"
          >
            ✕
          </button>
          {this.renderContent()}
        </div>
      </div>
    );
  }
}
