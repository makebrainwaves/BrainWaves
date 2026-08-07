import React, { Component } from 'react';
import { Button } from './ui/button';
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
import { HelpSidebar, HelpButton } from './CollectComponent/HelpSidebar';
import { DeviceActions } from '../actions';
import { Device, DeviceInfo, SignalQualityData } from '../constants/interfaces';
import type { DiscoveredStream } from '../../shared/lslTypes';

interface Props {
  connectedDevice: DeviceInfo | null | undefined;
  signalQualityObservable?: Observable<SignalQualityData>;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<Device>;
  availableLSLStreams?: Array<DiscoveredStream>;
}

interface State {
  isConnectModalOpen: boolean;
  isHelpVisible: boolean;
}

export default class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false,
      isHelpVisible: false,
    };
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleStopConnect = this.handleStopConnect.bind(this);
  }

  componentDidUpdate = (_prevProps: Props, prevState: State) => {
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
    this.props.DeviceActions.DisconnectFromDevice();
    this.setState({ isConnectModalOpen: false });
    this.props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE);
  }

  handleConnectModalClose() {
    this.setState({ isConnectModalOpen: false });
  }

  render() {
    return (
      <div className="flex items-center h-[90%]">
        {this.props.connectionStatus === CONNECTION_STATUS.CONNECTED &&
          this.props.signalQualityObservable && (
            <div className="flex w-full">
              <div className="w-2/5">
                <SignalQualityIndicatorComponent
                  signalQualityObservable={this.props.signalQualityObservable}
                  plottingInterval={PLOTTING_INTERVAL}
                />
              </div>
              <div className="w-3/5">
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={this.handleStopConnect}>
                    Disconnect EEG Device
                  </Button>
                </div>
                <ViewerComponent
                  signalQualityObservable={this.props.signalQualityObservable}
                  channels={this.props.connectedDevice?.channels}
                  plottingInterval={PLOTTING_INTERVAL}
                />
              </div>
            </div>
          )}
        {this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED && (
          <div className="flex w-full">
            <div className="w-5/12 p-2">
              <img src={eegImage} alt="EEG device" />
            </div>
            <div className="w-7/12 p-2">
              <h1>Explore Raw EEG</h1>
              <hr className="my-2" />
              <p>
                Connect directly to an EEG device and view raw streaming data
              </p>
              <Button variant="default" onClick={this.handleStartConnect}>
                Connect
              </Button>
            </div>
            <ConnectModal
              open={this.state.isConnectModalOpen}
              onClose={this.handleConnectModalClose}
              connectedDevice={this.props.connectedDevice}
              signalQualityObservable={this.props.signalQualityObservable}
              deviceAvailability={this.props.deviceAvailability}
              connectionStatus={this.props.connectionStatus}
              deviceType={this.props.deviceType}
              DeviceActions={this.props.DeviceActions}
              availableDevices={this.props.availableDevices}
              availableLSLStreams={this.props.availableLSLStreams}
            />
          </div>
        )}
        {this.state.isHelpVisible ? (
          <div className="fixed top-0 right-0 z-50 h-full w-80 shadow-lg">
            <HelpSidebar
              handleClose={() => this.setState({ isHelpVisible: false })}
            />
          </div>
        ) : (
          <div className="fixed bottom-6 right-6 z-40">
            <HelpButton
              onClick={() => this.setState({ isHelpVisible: true })}
            />
          </div>
        )}
      </div>
    );
  }
}
