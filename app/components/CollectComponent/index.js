// @flow
import React, { Component } from "react";
import { Modal, Button } from "semantic-ui-react";
import styles from "../styles/common.css";

import {
  EXPERIMENTS,
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from "../../constants/constants";
import { MainTimeline, Trial, Timeline } from "../../constants/interfaces";
import PreTestComponent from "./PreTestComponent";
import ConnectModal from "./ConnectModal";

interface Props {
  experimentActions: Object;
  client: ?any;
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
  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false
    };
  }

  render() {
    return (
      <div className={styles.mainContainer}>
        <Modal
          open={this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED}
          basic
          dimmer="inverted"
          size="small"
        >
          <Modal.Actions>
            <Button
              primary
              onClick={() => this.setState({ isConnectModalOpen: true })}
            >
              Connect Device
            </Button>
          </Modal.Actions>
        </Modal>
        <ConnectModal
          open={this.state.isConnectModalOpen}
          client={this.props.client}
          connectedDevice={this.props.connectedDevice}
          signalQualityObservable={this.props.signalQualityObservable}
          deviceType={this.props.deviceType}
          deviceAvailability={this.props.deviceAvailability}
          connectionStatus={this.props.connectionStatus}
          deviceActions={this.props.deviceActions}
          availableDevices={this.props.availableDevices}
        />
        <PreTestComponent
          client={this.props.client}
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
