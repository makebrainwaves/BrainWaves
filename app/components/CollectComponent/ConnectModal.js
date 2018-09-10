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
import faceHouseIcon from "../../assets/face_house/face_house_icon.jpg";

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
  }

  getDeviceName(device: any) {
    return this.props.deviceType === DEVICES.EMOTIV ? device.id : device.name;
  }

  handleSearch() {
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.state.selectedDevice);
  }

  handleStartTutorial() {
    this.setState({ tutorialProgress: 1 });
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
            <Image src={faceHouseIcon} size="tiny" centered />
          </Modal.Content>
          <Modal.Content>Searching for available headset(s)...</Modal.Content>
        </React.Fragment>
      );
    }
    if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      console.log("rendering connector screen", this.state.selectedDevice);
      return (
        <React.Fragment>
          <Modal.Content image>
            <Image src={faceHouseIcon} size="tiny" centered />
          </Modal.Content>
          <Modal.Content>
            Connecting to {this.getDeviceName(this.state.selectedDevice)}
            ...
          </Modal.Content>
        </React.Fragment>
      );
    }
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
              <Button fluid className={styles.secondaryButton}>
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
          <a onClick={this.handleStartTutorial}>Don't see your device?</a>
        </Modal.Content>
      </React.Fragment>
    );
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
