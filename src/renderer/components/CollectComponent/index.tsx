import { Observable } from 'rxjs';
import React, { useEffect, useState } from 'react';
import {
  EXPERIMENTS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import {
  ExperimentParameters,
  SignalQualityData,
  Device,
  DeviceInfo,
  ExperimentObject,
} from '../../constants/interfaces';
import type { DiscoveredStream } from '../../../shared/lslTypes';
import PreTestComponent from './PreTestComponent';
import ConnectModal from './ConnectModal';
import RunComponent from './RunComponent';
import { ExperimentActions, DeviceActions } from '../../actions';

export interface Props {
  ExperimentActions: typeof ExperimentActions;
  connectedDevice: DeviceInfo | null | undefined;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceType: DEVICES;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<Device>;
  availableLSLStreams: Array<DiscoveredStream>;
  type: EXPERIMENTS;
  experimentObject: ExperimentObject;
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  group: string;
  session: number;
  isEEGEnabled: boolean;
  title: string;
}

export default function Collect(props: Props) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isRunComponentOpen, setIsRunComponentOpen] = useState(
    !props.isEEGEnabled
  );

  // Prompt whenever EEG is on and no headset is connected — not just on mount.
  // Arriving connected and then dropping the headset otherwise left no way to
  // reach the modal short of leaving and re-entering Collect.
  useEffect(() => {
    if (
      props.isEEGEnabled &&
      !isRunComponentOpen &&
      !isConnectModalOpen &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTED &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTING
    ) {
      handleStartConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.connectionStatus, props.isEEGEnabled, isRunComponentOpen]);

  useEffect(() => {
    if (props.connectionStatus === CONNECTION_STATUS.CONNECTED) {
      setIsConnectModalOpen(false);
    }
  }, [props.connectionStatus]);

  function handleStartConnect() {
    setIsConnectModalOpen(true);
    props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.SEARCHING);
  }

  function handleConnectModalClose() {
    setIsConnectModalOpen(false);
  }

  function handleRunComponentOpen() {
    setIsRunComponentOpen(true);
  }

  function handleRunComponentClose() {
    setIsRunComponentOpen(false);
  }

  if (isRunComponentOpen) {
    return <RunComponent {...props} />;
  }
  return (
    <>
      <ConnectModal
        open={isConnectModalOpen}
        onClose={handleConnectModalClose}
        connectedDevice={props.connectedDevice}
        signalQualityObservable={props.signalQualityObservable ?? undefined}
        deviceAvailability={props.deviceAvailability}
        connectionStatus={props.connectionStatus}
        deviceType={props.deviceType}
        DeviceActions={props.DeviceActions}
        availableDevices={props.availableDevices}
        availableLSLStreams={props.availableLSLStreams}
      />
      <PreTestComponent
        connectedDevice={props.connectedDevice}
        signalQualityObservable={props.signalQualityObservable}
        deviceAvailability={props.deviceAvailability}
        connectionStatus={props.connectionStatus}
        DeviceActions={props.DeviceActions}
        ExperimentActions={props.ExperimentActions}
        availableDevices={props.availableDevices}
        type={props.type}
        isRunning={props.isRunning}
        params={props.params}
        title={props.title}
        subject={props.subject}
        group={props.group}
        session={props.session}
        openRunComponent={handleRunComponentOpen}
      />
    </>
  );
}
