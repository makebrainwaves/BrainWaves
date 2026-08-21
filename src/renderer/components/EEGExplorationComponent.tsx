import React, { useEffect, useState } from 'react';
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

export default function Home(props: Props) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  useEffect(() => {
    if (props.connectionStatus === CONNECTION_STATUS.CONNECTED) {
      setIsConnectModalOpen(false);
    }
  }, [props.connectionStatus]);

  function handleStartConnect() {
    setIsConnectModalOpen(true);
    props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING);
  }

  function handleStopConnect() {
    props.DeviceActions.DisconnectFromDevice();
    setIsConnectModalOpen(false);
    props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE);
  }

  function handleConnectModalClose() {
    setIsConnectModalOpen(false);
  }

  return (
    <div className="flex items-center h-[90%]">
      {props.connectionStatus === CONNECTION_STATUS.CONNECTED &&
        props.signalQualityObservable && (
          <div className="flex w-full">
            <div className="w-2/5">
              <SignalQualityIndicatorComponent
                signalQualityObservable={props.signalQualityObservable}
                plottingInterval={PLOTTING_INTERVAL}
              />
            </div>
            <div className="w-3/5">
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleStopConnect}>
                  Disconnect EEG Device
                </Button>
              </div>
              <ViewerComponent
                signalQualityObservable={props.signalQualityObservable}
                channels={props.connectedDevice?.channels}
                plottingInterval={PLOTTING_INTERVAL}
              />
            </div>
          </div>
        )}
      {props.connectionStatus !== CONNECTION_STATUS.CONNECTED && (
        <div className="flex w-full">
          <div className="w-5/12 p-2">
            <img src={eegImage} alt="EEG device" />
          </div>
          <div className="w-7/12 p-2">
            <h1>Explore Raw EEG</h1>
            <hr className="my-2" />
            <p>Connect directly to an EEG device and view raw streaming data</p>
            <Button variant="default" onClick={handleStartConnect}>
              Connect
            </Button>
          </div>
          <ConnectModal
            open={isConnectModalOpen}
            onClose={handleConnectModalClose}
            connectedDevice={props.connectedDevice}
            signalQualityObservable={props.signalQualityObservable}
            deviceAvailability={props.deviceAvailability}
            connectionStatus={props.connectionStatus}
            deviceType={props.deviceType}
            DeviceActions={props.DeviceActions}
            availableDevices={props.availableDevices}
            availableLSLStreams={props.availableLSLStreams}
          />
        </div>
      )}
      {isHelpVisible ? (
        <div className="fixed top-0 right-0 z-50 h-full w-80 shadow-lg">
          <HelpSidebar handleClose={() => setIsHelpVisible(false)} />
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-40">
          <HelpButton onClick={() => setIsHelpVisible(true)} />
        </div>
      )}
    </div>
  );
}
