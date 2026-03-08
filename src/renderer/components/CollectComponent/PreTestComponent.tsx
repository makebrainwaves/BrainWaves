import React, { Component } from 'react';
import Mousetrap from 'mousetrap';
import ViewerComponent from '../ViewerComponent';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { HelpSidebar, HelpButton } from './HelpSidebar';
import styles from '../styles/collect.module.css';
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
      <div className="p-4">
        <SignalQualityIndicatorComponent
          signalQualityObservable={this.props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
        <div className="p-4">
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className={styles.greatSignal}>&#9679;</span>
              <span>Strong Signal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={styles.okSignal}>&#9679;</span>
              <span>Mediocre signal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={styles.badSignal}>&#9679;</span>
              <span>Weak Signal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={styles.noSignal}>&#9679;</span>
              <span>No Signal</span>
            </li>
          </ul>
        </div>
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
      <div className={`relative flex overflow-hidden ${styles.preTestPushable}`}>
        {this.state.isSidebarVisible && (
          <div className="absolute right-0 top-0 h-full w-80 z-10 border rounded-lg p-4 bg-white shadow-sm overflow-y-auto">
            <HelpSidebar handleClose={this.handleSidebarToggle} />
          </div>
        )}
        <div className={`flex-1 ${this.state.isSidebarVisible ? 'mr-80' : ''}`}>
          <div
            className={`grid grid-cols-12 gap-4 text-center ${styles.preTestContainer}`}
          >
            <div className="col-span-12 flex items-center w-full gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-left">Collect</h1>
              </div>
              <div className="flex-1 flex justify-end gap-2">
                <PreviewButton
                  isPreviewing={this.state.isPreviewing}
                  onClick={(e) => this.handlePreview(e)}
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED
                  }
                  onClick={this.props.openRunComponent}
                >
                  Run &amp; Record Experiment
                </button>
              </div>
            </div>
            <div className={`col-span-6 ${styles.previewEEGWindow}`}>
              {this.renderSignalQualityOrPreview()}
            </div>
            <div className="col-span-6">
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
