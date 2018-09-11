// @flow
import React, { Component } from "react";
import { Modal, Button, Ref, Segment } from "semantic-ui-react";
import styles from "../styles/common.css";

import {
  EXPERIMENTS,
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from "../../constants/constants";
import { MainTimeline, Trial, Timeline } from "../../constants/interfaces";
import { isNil } from "lodash";
import PreTestComponent from "./PreTestComponent";
import ConnectModal from "./ConnectModal";

interface Props {
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
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  // dir: ?string,
  subject: string;
  session: number;
}

interface State {
  isConnectModalOpen: boolean;
}

export default class Collect extends Component<Props, State> {
  props: Props;
  state: State;
  handleStartConnect: () => void;
  handleConnectModalClose: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false
    };
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
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

  render() {
    return (
      <div className={styles.mainContainer}>
        <Modal
          basic
          centered
          open={this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED}
          dimmer="inverted"
          size="small"
        >
          <Segment basic textAlign="center">
            <Button primary onClick={this.handleStartConnect}>
              Connect Device
            </Button>
          </Segment>
        </Modal>
        <ConnectModal
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
          mainTimeline={this.props.mainTimeline}
          trials={this.props.trials}
          timelines={this.props.timelines}
          subject={this.props.subject}
          session={this.props.session}
        />
      </div>
    );
  }
}
