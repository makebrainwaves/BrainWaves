// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Item,
  Segment,
  Header,
  List
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./styles/common.css";
import {
  DEVICES,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY
} from "../constants/constants";

interface Props {
  client: ?any;
  connectedDevice: Object;
  rawObservable: ?any;
  deviceType: DEVICES;
  deviceActions: Object;
  availableDevices: Array<any>;
}

export default class Connect extends Component<Props> {
  props: Props;
  handleEmotivSelect: () => void;
  handleMuseSelect: () => void;
  handleStartExperiment: Object => void;
  handleConnect: () => void;

  constructor(props: Props) {
    super(props);
    this.handleEmotivSelect = this.handleEmotivSelect.bind(this);
    this.handleMuseSelect = this.handleMuseSelect.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 300, {
      leading: true,
      trailing: false
    });
  }

  handleStartExperiment(e: Object) {
    if (isNil(this.props.rawObservable)) {
      e.preventDefault();
    }
  }

  handleEmotivSelect() {
    this.props.deviceActions.setDeviceType(DEVICES.EMOTIV);
  }
  de;
  handleMuseSelect() {
    this.props.deviceActions.setDeviceType(DEVICES.MUSE);
  }

  handleSearch() {
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.props.availableDevices[0]);
  }

  renderConnectionStatus() {
    if (isNil(this.props.rawObservable)) {
      return (
        <div>
          <Segment basic>
            <Item>
              <Item.Header>
                <Icon name="x" color="red" />Disconnected
              </Item.Header>
            </Item>
          </Segment>
        </div>
      );
    }
    return (
      <div>
        <Segment basic>
          <Item>
            <Item.Header>
              <Icon name="check" color="green" />Connected
            </Item.Header>
          </Item>
        </Segment>
        <Segment basic>
          <Link to="/experimentRun">
            <Button onClick={this.handleStartExperiment}>
              Begin Experiment
            </Button>
          </Link>
        </Segment>
      </div>
    );
  }

  renderConnectionInstructions(deviceType: DEVICES) {
    if (deviceType === DEVICES.EMOTIV) {
      return (
        <List ordered>
          <List.Item>
            Ensure Epoc or Epoc+ headset is charged and the sensors are hydrated
            and installed
          </List.Item>
          <List.Item>Ensure that the CortexUI app is running</List.Item>
          <List.Item>Plug in the Emotiv USB dongle</List.Item>
          <List.Item>Turn the headset on</List.Item>
          <List.Item>Slide the headset down from the top of the head</List.Item>
          <List.Item>
            <Button compact onClick={this.props.deviceActions.initEmotiv}>
              Connect
            </Button>
          </List.Item>
          <List.Item>
            Check the signal quality of the EEG through the CortexUI app. Signal
            quality should be at least 85%
          </List.Item>
        </List>
      );
    }
    return (
      <List ordered relaxed>
        <List.Item>Ensure Muse headband is charged</List.Item>
        <List.Item>Make sure bluetooth is enabled on computer</List.Item>
        <List.Item>Turn the Muse headband on</List.Item>
        <List.Item>
          Fit the earpieces snugly behind your ears and adjust the headband so
          it rests mid foreheard
        </List.Item>
        <List.Item>
          Clear any hair that might prevent the device from making contact with
          your skin
        </List.Item>
        <List.Item>
          <Button onClick={this.handleSearch}>Search</Button>
          <Button onClick={this.handleConnect}>Connect</Button>
        </List.Item>
      </List>
    );
  }

  render() {
    return (
      <div>
        <div className={styles.mainContainer}>
          <Grid columns={1} centered style={{ height: "70%" }}>
            <Grid.Row stretched style={{ height: "100%" }}>
              <Segment padded="very" compact raised color="red">
                <Grid columns={2}>
                  <Grid.Column>
                    <Header as="h3">Connect EEG Device</Header>
                    {this.renderConnectionStatus()}
                  </Grid.Column>
                  <Grid.Column>
                    <Header as="h4">Select EEG Device Type</Header>
                    <Button.Group>
                      <Button
                        onClick={this.handleEmotivSelect}
                        active={this.props.deviceType === DEVICES.EMOTIV}
                      >
                        Epoc
                      </Button>
                      <Button.Or />
                      <Button
                        onClick={this.handleMuseSelect}
                        active={this.props.deviceType === DEVICES.MUSE}
                      >
                        Muse
                      </Button>
                    </Button.Group>
                    {this.renderConnectionInstructions(this.props.deviceType)}
                  </Grid.Column>
                </Grid>
              </Segment>
            </Grid.Row>
            <Segment basic>
              {this.props.availableDevices.map((device, index) => (
                <Segment key={index + "h"} basic>
                  {Object.toString(device)}
                </Segment>
              ))}
            </Segment>
          </Grid>
        </div>
      </div>
    );
  }
}
