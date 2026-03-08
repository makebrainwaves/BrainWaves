import React, { Component } from 'react';
import { Observable } from 'rxjs';

import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../constants/constants';
import eegImage from '../assets/common/EEG.png';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import ViewerComponent from './ViewerComponent';
import ConnectModal from './CollectComponent/ConnectModal';
import styles from './styles/common.module.css';
import { DeviceActions } from '../actions';
import { SignalQualityData } from '../constants/interfaces';

interface Props {
  history: { push: (path: string) => void };
  connectedDevice: Record<string, any>;
  signalQualityObservable?: Observable<SignalQualityData>;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<any>;
}

interface State {
  isConnectModalOpen: boolean;
}

export default class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false,
    };
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleStopConnect = this.handleStopConnect.bind(this);
  }

  componentDidUpdate = (prevProps: Props, prevState: State) => {
    if (
      this.props.connectionStatus === CONNECTION_STATUS.CONNECTED &&
      prevState.isConnectModalOpen
    ) {
      this.setState({ isConnectModalOpen: false });
    }
  };

  handleStartConnect() {
    this.setState({ isConnectModalOpen: true });
    this.props.DeviceActions.SetDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleStopConnect() {
    this.props.DeviceActions.DisconnectFromDevice(this.props.connectedDevice);
    this.setState({ isConnectModalOpen: false });
    this.props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE);
  }

  handleConnectModalClose() {
    this.setState({ isConnectModalOpen: false });
  }

  render() {
    return (
      <div
        className={`grid grid-cols-12 gap-4 ${styles.contentGrid}`}
        style={{ alignItems: 'center' }}
      >
        {this.props.connectionStatus === CONNECTION_STATUS.CONNECTED &&
          this.props.signalQualityObservable && (
            <div className="col-span-12 flex items-center w-full gap-4">
              <div className="col-span-6 flex-1">
                <SignalQualityIndicatorComponent
                  signalQualityObservable={this.props.signalQualityObservable}
                  plottingInterval={PLOTTING_INTERVAL}
                />
              </div>
              <div className="col-span-10 flex-1">
                <div className={styles.disconnectButtonContainer}>
                  <button
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
                    onClick={this.handleStopConnect}
                  >
                    Disconnect EEG Device
                  </button>
                </div>
                <ViewerComponent
                  signalQualityObservable={this.props.signalQualityObservable}
                  deviceType={this.props.deviceType}
                  plottingInterval={PLOTTING_INTERVAL}
                />
              </div>
            </div>
          )}
        {this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED && (
          <div className="col-span-12 flex items-center w-full gap-4">
            <div className="col-span-5 flex-1">
              <div className="p-4">
                <img src={eegImage} />
              </div>
            </div>

            <div className="col-span-11 flex-1">
              <div className="p-4">
                <h1 className="text-2xl font-bold">Explore Raw EEG</h1>
                <hr className="my-4 border-gray-200" />
                <p>
                  Connect directly to an EEG device and view raw streaming data
                </p>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                  onClick={this.handleStartConnect}
                >
                  Connect
                </button>
              </div>
            </div>
            <ConnectModal
              history={this.props.history}
              open={this.state.isConnectModalOpen}
              onClose={this.handleConnectModalClose}
              connectedDevice={this.props.connectedDevice}
              signalQualityObservable={this.props.signalQualityObservable}
              deviceType={this.props.deviceType}
              deviceAvailability={this.props.deviceAvailability}
              connectionStatus={this.props.connectionStatus}
              DeviceActions={this.props.DeviceActions}
              availableDevices={this.props.availableDevices}
            />
          </div>
        )}
      </div>
    );
  }
}
