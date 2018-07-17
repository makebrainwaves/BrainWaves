// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Item,
  Step,
  Segment,
  Header,
  List
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./DeviceConnect.css";
import { DEVICES } from "../constants/constants";

interface Props {
  client: ?any;
  connectedDevice: Object;
  rawObservable: ?any;
  deviceType: DEVICES;
  deviceActions: Object;
}

interface State {}

export default class DeviceConnect extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      selectedDevice: DEVICES.EMOTIV
    };
    this.handleEmotivSelect = this.handleEmotivSelect.bind(this);
    this.handleMuseSelect = this.handleMuseSelect.bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
  }

  handleStartExperiment(e: Object) {
    if (isNil(this.props.rawObservable)) {
      e.preventDefault();
    }
  }

  handleEmotivSelect() {
    this.setState({ selectedDevice: DEVICES.EMOTIV });
  }

  handleMuseSelect() {
    this.setState({ selectedDevice: DEVICES.MUSE });
  }

  renderConnectionStatus() {
    if (isNil(this.props.rawObservable)) {
      return (
        <div>
          <Item>
            <Item.Header>
              <Icon name="x" color="red" />Disconnected
            </Item.Header>
          </Item>
        </div>
      );
    }
    return (
      <div>
        <Item>
          <Item.Header>
            <Icon name="check" color="green" />Connected
          </Item.Header>
        </Item>
        <Link to="/experimentRun">
          <Button onClick={this.handleStartExperiment}>Begin Experiment</Button>
        </Link>
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
      <List ordered>
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
          <Button onClick={this.props.deviceActions.initMuse}>Connect</Button>
        </List.Item>
      </List>
    );
  }

  render() {
    return (
      <div>
        <div className={styles.deviceContainer}>
          <Link to="/" className={styles.homeButton}>
            <Icon name="home" size="large" color="black" inverted />
          </Link>
          <Grid columns={1} centered style={{ height: "70%" }}>
            <Grid.Row stretched style={{ height: "100%" }}>
              <Segment padded="very" compact raised color="purple">
                <Grid columns={2}>
                  <Grid.Column>
                    <Header as="h3">Connect EEG Device</Header>
                    {this.renderConnectionStatus()}
                  </Grid.Column>
                  <Grid.Column>
                    <Header as="h4">Select EEG Device Type</Header>
                    <Button.Group>
                      <Button onClick={this.handleEmotivSelect}>Epoc</Button>
                      <Button.Or />
                      <Button onClick={this.handleMuseSelect}>Muse</Button>
                    </Button.Group>
                    {this.renderConnectionInstructions(
                      this.state.selectedDevice
                    )}
                  </Grid.Column>
                </Grid>
              </Segment>
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}