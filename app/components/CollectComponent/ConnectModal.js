import React, { Component } from "react";
import { isNil, debounce } from "lodash";
import {
  Modal,
  Button,
  Segment,
  Image,
  List,
  Grid,
  Divider
} from "semantic-ui-react";
import {
  DEVICES,
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS
} from "../../constants/constants";
import styles from "../styles/connectmodal.css";
import blake from "../../assets/face_house/faces/Blake_1.jpg";

interface Props {
  open: boolean;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  availableDevices: Array<any>;
}

interface State {
  selectedDevice: ?any;
  tutorialProgress: number;
}

export default class ConnectModal extends Component<Props, State> {
  handleConnect: () => void;
  handleSearch: () => void;
  handleStartTutorial: () => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedDevice: null,
      tutorialProgress: 0
    };
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 1000, {
      leading: true,
      trailing: false
    });
    this.handleTutorialProgress = this.handleTutorialProgress.bind(this);
  }

  componentWillUpdate(nextProps: Props) {
    console.log(this.props.deviceAvailability, nextProps.deviceAvailability);
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.NONE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ) {
      this.setState({ tutorialProgress: 1 });
    }
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.NONE
    ) {
      this.setState({ tutorialProgress: 0 });
    }
  }

  getDeviceName(device: any) {
    return isNil(device.name) ? device.id : device.name;
  }

  handleSearch() {
    this.setState({ tutorialProgress: 0 });
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.state.selectedDevice);
  }

  handleTutorialProgress(step: number) {
    this.setState({ tutorialProgress: step });
  }

  renderAvailableDeviceList() {
    return (
      <Segment basic>
        <List divided relaxed inverted>
          {this.props.availableDevices.map((device, index) => (
            <List.Item className={styles.deviceItem} key={index}>
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
                <List.Header>{this.getDeviceName(device)}</List.Header>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </Segment>
    );
  }

  renderContent() {
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING) {
      return (
        <React.Fragment>
          <Modal.Content image>
            <Image src={blake} size="tiny" centered />
          </Modal.Content>
          <Modal.Content className={styles.searchingText}>
            Searching for available headset(s)...
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      console.log("rendering connector screen", this.state.selectedDevice);
      return (
        <React.Fragment>
          <Modal.Content image>
            <Image src={blake} size="tiny" centered />
          </Modal.Content>
          <Modal.Content className={styles.searchingText}>
            Connecting to {this.getDeviceName(this.state.selectedDevice)}
            ...
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.state.tutorialProgress === 1) {
      return (
        <React.Fragment>
          <Modal.Header className={styles.connectHeader}>
            Turn your headset on
          </Modal.Header>
          <Modal.Content>
            Make sure your headset is on and fully charged.
            <p />
            If the headset needs charging, set the power switch to off and plug
            in the headset. <b>Do not charge the headset while wearing it</b>
          </Modal.Content>
          <Modal.Content>
            <Grid textAlign="center" columns="equal">
              <Grid.Column>
                <Button
                  fluid
                  className={styles.secondaryButton}
                  onClick={() => this.handleTutorialProgress(0)}
                >
                  Back
                </Button>
              </Grid.Column>
              <Grid.Column>
                <Button
                  fluid
                  className={styles.primaryButton}
                  onClick={() => this.handleTutorialProgress(2)}
                >
                  Next
                </Button>
              </Grid.Column>
            </Grid>
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.state.tutorialProgress === 2) {
      return (
        <React.Fragment>
          <Modal.Header className={styles.connectHeader}>
            Insert the USB Receiver
          </Modal.Header>
          <Modal.Content>
            Inser the USB receiver into a USB port on your computer. Ensure that
            the LED on the receiver is continously lit or flickering rapidly. If
            it is blinking slowly or not illuminated, remove and reinsert the
            receiver
          </Modal.Content>
          <Modal.Content>
            <Grid textAlign="center" columns="equal">
              <Grid.Column>
                <Button
                  fluid
                  className={styles.secondaryButton}
                  onClick={() => this.handleTutorialProgress(1)}
                >
                  Back
                </Button>
              </Grid.Column>
              <Grid.Column>
                <Button
                  fluid
                  className={styles.primaryButton}
                  onClick={this.handleSearch}
                >
                  Next
                </Button>
              </Grid.Column>
            </Grid>
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE) {
      return (
        <React.Fragment>
          <Modal.Header className={styles.connectHeader}>
            Headset(s) found
          </Modal.Header>
          <Modal.Content>
            Please select which headset you would like to connect.
          </Modal.Content>
          <Modal.Content>{this.renderAvailableDeviceList()}</Modal.Content>
          <Divider section hidden />
          <Modal.Content>
            <Grid textAlign="center" columns="equal">
              <Grid.Column>
                <Button
                  fluid
                  className={styles.secondaryButton}
                  onClick={() => this.handleTutorialProgress(1)}
                >
                  Back
                </Button>
              </Grid.Column>
              <Grid.Column>
                <Button
                  fluid
                  className={styles.primaryButton}
                  disabled={isNil(this.state.selectedDevice)}
                  onClick={this.handleConnect}
                >
                  Connect
                </Button>
              </Grid.Column>
            </Grid>
          </Modal.Content>
          <Modal.Content>
            <a
              role="link"
              tabIndex={0}
              onClick={() => this.handleTutorialProgress(1)}
            >
              Don't see your device?
            </a>
          </Modal.Content>
        </React.Fragment>
      );
    }
  }

  render() {
    return (
      <Modal
        basic
        centered
        open={this.props.open}
        onOpen={this.handleSearch}
        className={styles.connectModal}
      >
        {this.renderContent()}
      </Modal>
    );
  }
}
