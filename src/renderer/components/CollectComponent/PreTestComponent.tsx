import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import Mousetrap from 'mousetrap';
import ViewerComponent from '../ViewerComponent';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { HelpSidebar, HelpButton } from './HelpSidebar';
import { getExperimentFromType } from '../../utils/labjs/functions';
import { ExperimentActions, DeviceActions } from '../../actions';
import {
  DEVICE_AVAILABILITY,
  EXPERIMENTS,
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
} from '../../constants/constants';
import {
  ExperimentParameters,
  Device,
  DeviceInfo,
  SignalQualityData,
} from '../../constants/interfaces';
import { Observable } from 'rxjs';

interface Props {
  ExperimentActions: typeof ExperimentActions;
  connectedDevice: DeviceInfo | null | undefined;
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<Device>;
  type: EXPERIMENTS;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  group: string;
  session: number;
  title: string;
  openRunComponent: () => void;
}

export default function PreTestComponent(props: Props) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    Mousetrap.bind('esc', props.ExperimentActions.Stop);
    return () => {
      Mousetrap.unbind('esc');
    };
  }, [props.ExperimentActions]);

  function endPreview() {
    setIsPreviewing(false);
  }

  function handlePreview(e) {
    e.target.blur();
    setIsSidebarVisible(false);
    setIsPreviewing((prev) => !prev);
  }

  function handleSidebarToggle() {
    setIsSidebarVisible((prev) => !prev);
  }

  function renderSignalQualityOrPreview() {
    if (isPreviewing) {
      return (
        <PreviewExperimentComponent
          {...getExperimentFromType(props.type)}
          isPreviewing={isPreviewing}
          onEnd={endPreview}
          type={props.type}
          params={props.params}
          title={props.title}
        />
      );
    }
    return (
      <div className="p-2">
        <SignalQualityIndicatorComponent
          signalQualityObservable={props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
        <ul className="mt-2 space-y-1">
          <li>
            <span className="text-signal-great">●</span> Strong Signal
          </li>
          <li>
            <span className="text-signal-ok">●</span> Mediocre signal
          </li>
          <li>
            <span className="text-signal-bad">●</span> Weak Signal
          </li>
          <li>
            <span className="text-signal-none">●</span> No Signal
          </li>
        </ul>
      </div>
    );
  }

  function renderHelpButton() {
    if (!isSidebarVisible) {
      return <HelpButton onClick={handleSidebarToggle} />;
    }
  }

  return (
    <div className="relative flex h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      {isSidebarVisible && (
        <div className="absolute right-0 top-0 h-full w-64 z-10">
          <HelpSidebar handleClose={handleSidebarToggle} />
        </div>
      )}
      <div className="flex-1 p-[3%]">
        <div className="flex items-center justify-between mb-4">
          <h1>Collect</h1>
          <div className="flex gap-2">
            <PreviewButton
              isPreviewing={isPreviewing}
              onClick={(e) => handlePreview(e)}
            />
            <Button
              variant="default"
              disabled={
                props.connectionStatus !== CONNECTION_STATUS.CONNECTED
              }
              onClick={props.openRunComponent}
            >
              Run & Record Experiment
            </Button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-1/2 h-full items-center mb-5">
            {renderSignalQualityOrPreview()}
          </div>
          <div className="w-1/2">
            <ViewerComponent
              signalQualityObservable={props.signalQualityObservable}
              channels={props.connectedDevice?.channels}
              plottingInterval={PLOTTING_INTERVAL}
            />
            {renderHelpButton()}
          </div>
        </div>
      </div>
    </div>
  );
}