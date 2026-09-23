import { Observable } from 'rxjs';
import React, { useContext, useEffect, useState } from 'react';
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
import PreTestComponent from './PreTestComponent';
import { HeadsetSetupContext } from '../../containers/AppShellContainer';
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
  const [isRunComponentOpen, setIsRunComponentOpen] = useState(
    !props.isEEGEnabled
  );
  const { openHeadsetSetup } = useContext(HeadsetSetupContext);

  useEffect(() => {
    if (
      props.isEEGEnabled &&
      !isRunComponentOpen &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTED &&
      props.connectionStatus !== CONNECTION_STATUS.CONNECTING
    ) {
      openHeadsetSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.connectionStatus, props.isEEGEnabled, isRunComponentOpen]);

  function handleRunComponentOpen() {
    setIsRunComponentOpen(true);
  }

  if (isRunComponentOpen) {
    return <RunComponent {...props} />;
  }
  return (
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
  );
}
