// @flow
import React, { Component } from 'react';
import { isNil } from 'lodash';
import {
  EXPERIMENTS,
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from '../../constants/constants';
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';
import PreTestComponent from './PreTestComponent';
import ConnectModal from './ConnectModal';
import RunComponent from './RunComponent';

interface Props {
  history: Object;
  experimentActions: Object;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  availableDevices: Array<any>;
  type: ?EXPERIMENTS;
  isRunning: boolean;
  params: ?ExperimentParameters;
  mainTimeline: ?MainTimeline;
  trials: ?{ [string]: Trial };
  timelines: ?{};
  subject: string;
  group: string;
  session: number;
  isEEGEnabled: boolean;
}

interface State {
  isConnectModalOpen: boolean;
  isRunComponentOpen: boolean;
}

export default class Collect extends Component<Props, State> {
  props: Props;
  state: State;
  handleStartConnect: () => void;
  handleConnectModalClose: () => void;
  handleRunComponentOpen: () => void;
  handleRunComponentClose: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false,
      isRunComponentOpen: !props.isEEGEnabled
    };
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
    this.handleRunComponentOpen = this.handleRunComponentOpen.bind(this);
    this.handleRunComponentClose = this.handleRunComponentClose.bind(this);
    if (isNil(props.params)) {
      props.experimentActions.loadDefaultTimeline();
    }
  }

  componentDidMount() {
    if (
      this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED &&
      this.props.isEEGEnabled
    ) {
      this.handleStartConnect();
    }
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
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnectModalClose() {
    this.setState({ isConnectModalOpen: false });
  }

  handleRunComponentOpen() {
    this.setState({ isRunComponentOpen: true });
  }

  handleRunComponentClose() {
    this.setState({ isRunComponentOpen: false });
  }

  render() {
    if (this.state.isRunComponentOpen) {
      return (
        <RunComponent
          {...this.props}
          closeRunComponent={this.handleRunComponentClose}
        />
      );
    }
    return (
      <React.Fragment>
        <ConnectModal
          history={this.props.history}
          open={this.state.isConnectModalOpen}
          onClose={this.handleConnectModalClose}
          connectedDevice={this.props.connectedDevice}
          signalQualityObservable={this.props.signalQualityObservable}
          deviceType={this.props.deviceType}
          deviceAvailability={this.props.deviceAvailability}
          connectionStatus={this.props.connectionStatus}
          deviceActions={this.props.deviceActions}
          availableDevices={this.props.availableDevices}
        />
        <PreTestComponent
          connectedDevice={this.props.connectedDevice}
          signalQualityObservable={this.props.signalQualityObservable}
          deviceType={this.props.deviceType}
          deviceAvailability={this.props.deviceAvailability}
          connectionStatus={this.props.connectionStatus}
          deviceActions={this.props.deviceActions}
          experimentActions={this.props.experimentActions}
          availableDevices={this.props.availableDevices}
          type={this.props.type}
          isRunning={this.props.isRunning}
          params={this.props.params}
          mainTimeline={this.props.mainTimeline}
          trials={this.props.trials}
          timelines={this.props.timelines}
          subject={this.props.subject}
          group={this.props.group}
          session={this.props.session}
          openRunComponent={this.handleRunComponentOpen}
        />
      </React.Fragment>
    );
  }
}
