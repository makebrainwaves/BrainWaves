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
import { isNil, debounce } from "lodash";
import styles from "./styles/common.css";
import ViewerComponent from "./ViewerComponent";
import SignalQualityIndicatorComponent from "./SignalQualityIndicatorComponent";
import {
  DEVICES,
  DEVICE_AVAILABILITY,
  PLOTTING_INTERVAL
} from "../constants/constants";

interface Props {
  client: ?any;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  deviceActions: Object;
  availableDevices: Array<any>;
}

interface State {
  selectedDevice: ?any;
}

export default class Connect extends Component<Props, State> {
  props: Props;
  handleEmotivSelect: () => void;
  handleMuseSelect: () => void;
  handleStartExperiment: Object => void;
  handleConnect: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedDevice: null
    };
    this.handleEmotivSelect = debounce(
      this.handleEmotivSelect.bind(this),
      300,
      {
        leading: true,
        trailing: false
      }
    );
    this.handleMuseSelect = debounce(this.handleMuseSelect.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 1000, {
      leading: true,
      trailing: false
    });
  }

  componentDidMount() {
    if (isNil(this.props.client)) {
      this.props.deviceActions.setDeviceType(DEVICES.EMOTIV);
    }
  }

  handleStartExperiment(e: Object) {
    if (isNil(this.props.signalQualityObservable)) {
      e.preventDefault();
    }
  }

  handleEmotivSelect() {
    this.props.deviceActions.setDeviceType(DEVICES.EMOTIV);
  }

  handleMuseSelect() {
    this.props.deviceActions.setDeviceType(DEVICES.MUSE);
  }

  handleSearch() {
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.state.selectedDevice);
  }

  renderViewer() {
    if (!isNil(this.props.signalQualityObservable)) {
      return (
        <ViewerComponent
          signalQualityObservable={this.props.signalQualityObservable}
          deviceType={this.props.deviceType}
          samplingRate={this.props.connectedDevice["samplingRate"]}
          plottingInterval={PLOTTING_INTERVAL}
        />
      );
    }
  }

  renderSignalQualityIndicator() {
    if (!isNil(this.props.signalQualityObservable)) {
      return (
        <SignalQualityIndicatorComponent
          signalQualityObservable={this.props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
      );
    }
  }

  renderAvailableDeviceList() {
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.NONE) {
      return (
        <Segment basic>
          <Button onClick={this.handleSearch}>Search</Button>
        </Segment>
      );
    }
    return (
      <Segment basic>
        <Header as="h4">Available Devices:</Header>
        <List divided relaxed>
          {this.props.availableDevices.map((device, index) => (
            <List.Item key={index}>
              <List.Icon
                link
                name={
                  this.state.selectedDevice === device
                    ? "check circle outline"
                    : "circle outline"
                }
                size="large"
                verticalAlign="middle"
                onClick={() => this.setState({ selectedDevice: device })}
              />
              <List.Content>
                <List.Header>
                  {this.props.deviceType === DEVICES.EMOTIV
                    ? device.id
                    : device.name}
                </List.Header>
              </List.Content>
            </List.Item>
          ))}
        </List>
        <Segment basic>
          <Button
            disabled={isNil(this.state.selectedDevice)}
            onClick={this.handleConnect}
          >
            Connect
          </Button>
        </Segment>
        <Segment basic>
          <Button onClick={this.handleSearch}>Search</Button>
        </Segment>
      </Segment>
    );
  }

  renderConnectionStatus() {
    if (isNil(this.props.signalQualityObservable)) {
      return (
        <div>
          <Segment basic>
            <Item>
              <Item.Header>
                <Icon name="x" color="red" />
                Disconnected
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
              <Icon name="check" color="green" />
              Connected
            </Item.Header>
          </Item>
        </Segment>
        <Segment basic>
          <Link to="/experimentRun">
            <Button primary onClick={this.handleStartExperiment}>
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
          <List.Item>Search for available devices</List.Item>
          <List.Item>Connect to your device of choice</List.Item>
          <List.Item>Slide the headset down from the top of the head</List.Item>
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
        <List.Item>Search for available devices</List.Item>
        <List.Item>Connect to your device of choice</List.Item>
        <List.Item>
          Fit the earpieces snugly behind your ears and adjust the headband so
          it rests mid foreheard
        </List.Item>
        <List.Item>
          Clear any hair that might prevent the device from making contact with
          your skin
        </List.Item>
      </List>
    );
  }

  render() {
    return (
      <div>
        <div className={styles.mainContainer}>
          <Grid columns={2} centered stretched style={{ height: "100%" }}>
            <Grid.Column floated="left" width="6">
              <Grid.Row style={{ height: "100%" }}>
                <Segment padded="very" compact raised color="red">
                  <Grid columns={2}>
                    <Grid.Column>
                      <Header as="h3">Connect EEG Device</Header>
                      {this.renderConnectionStatus()}
                      {this.renderAvailableDeviceList()}
                      {this.renderSignalQualityIndicator()}
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
            </Grid.Column>
            <Grid.Column id="graphColumn" floated="right" width="10">
              {this.renderViewer()}
            </Grid.Column>
          </Grid>
        </div>
      </div>
    );
  }
}
