import React, { Component } from 'react';
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
  DEVICES,
  DEVICE_AVAILABILITY,
  EXPERIMENTS,
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
} from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';

interface Props {
  ExperimentActions: typeof ExperimentActions;
  connectedDevice: Record<string, any>;
  signalQualityObservable: any | null | undefined;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<any>;
  type: EXPERIMENTS;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  group: string;
  session: number;
  title: string;
  openRunComponent: () => void;
}

interface State {
  isPreviewing: boolean;
  isSidebarVisible: boolean;
}

export default class PreTestComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isPreviewing: false,
      isSidebarVisible: true,
    };
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.endPreview = this.endPreview.bind(this);
  }

  componentDidMount() {
    Mousetrap.bind('esc', this.props.ExperimentActions.Stop);
  }

  componentWillUnmount() {
    Mousetrap.unbind('esc');
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handlePreview(e) {
    e.target.blur();
    this.setState((prevState) => ({
      ...prevState,
      isSidebarVisible: false,
      isPreviewing: !prevState.isPreviewing,
    }));
  }

  handleSidebarToggle() {
    this.setState((prevState) => ({
      ...prevState,
      isSidebarVisible: !prevState.isSidebarVisible,
    }));
  }

  renderSignalQualityOrPreview() {
    if (this.state.isPreviewing) {
      return (
        <PreviewExperimentComponent
          {...getExperimentFromType(this.props.type)}
          isPreviewing={this.state.isPreviewing}
          onEnd={this.endPreview}
          type={this.props.type}
          params={this.props.params}
          title={this.props.title}
        />
      );
    }
    return (
      <div className="p-2">
        <SignalQualityIndicatorComponent
          signalQualityObservable={this.props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
        <ul className="mt-2 space-y-1">
          <li><span className="text-signal-great">●</span> Strong Signal</li>
          <li><span className="text-signal-ok">●</span> Mediocre signal</li>
          <li><span className="text-signal-bad">●</span> Weak Signal</li>
          <li><span className="text-signal-none">●</span> No Signal</li>
        </ul>
      </div>
    );
  }

  renderHelpButton() {
    if (!this.state.isSidebarVisible) {
      return <HelpButton onClick={this.handleSidebarToggle} />;
    }
  }

  render() {
    return (
      <div className="relative flex h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
        {this.state.isSidebarVisible && (
          <div className="absolute right-0 top-0 h-full w-64 z-10">
            <HelpSidebar handleClose={this.handleSidebarToggle} />
          </div>
        )}
        <div className="flex-1 p-[3%]">
          <div className="flex items-center justify-between mb-4">
            <h1>Collect</h1>
            <div className="flex gap-2">
              <PreviewButton
                isPreviewing={this.state.isPreviewing}
                onClick={(e) => this.handlePreview(e)}
              />
              <Button
                variant="default"
                disabled={
                  this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED
                }
                onClick={this.props.openRunComponent}
              >
                Run & Record Experiment
              </Button>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-1/2 h-full items-center mb-5">
              {this.renderSignalQualityOrPreview()}
            </div>
            <div className="w-1/2">
              <ViewerComponent
                signalQualityObservable={this.props.signalQualityObservable}
                deviceType={this.props.deviceType}
                plottingInterval={PLOTTING_INTERVAL}
              />
              {this.renderHelpButton()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
