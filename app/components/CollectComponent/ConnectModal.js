import React, { Component } from 'react';
import { isNil, debounce } from 'lodash';
import {
  Modal,
  Button,
  Segment,
  // Image,
  List,
  Grid,
  Divider
} from 'semantic-ui-react';
import {
  DEVICES,
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS,
  SCREENS
} from '../../constants/constants';
import styles from '../styles/collect.css';

interface Props {
  history: Object;
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
  instructionProgress: number;
}

const INSTRUCTION_PROGRESS = {
  SEARCHING: 0,
  TURN_ON: 1,
  COMPUTER_CONNECTABILITY: 2
};

export default class ConnectModal extends Component<Props, State> {
  handleConnect: () => void;
  handleSearch: () => void;
  handleStartTutorial: () => void;

  static getDeviceName(device: any): string {
    if (!isNil(device)) {
      if (Object.prototype.hasOwnProperty.call(device, 'name')) {
        return device.name;
      }
      if (Object.prototype.hasOwnProperty.call(device, 'name')) {
        return device.id;
      }
    }
    return '';
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedDevice: null,
      instructionProgress: INSTRUCTION_PROGRESS.SEARCHING
    };
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 1000, {
      leading: true,
      trailing: false
    });
    this.handleinstructionProgress = this.handleinstructionProgress.bind(this);
  }

  componentWillUpdate(nextProps: Props) {
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.NONE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.SEARCHING
    ) {
      this.setState({ instructionProgress: 1 });
    }
    if (
      nextProps.deviceAvailability === DEVICE_AVAILABILITY.AVAILABLE &&
      this.props.deviceAvailability === DEVICE_AVAILABILITY.NONE
    ) {
      this.setState({ instructionProgress: 0 });
    }
  }

  handleSearch() {
    this.setState({ instructionProgress: 0 });
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.state.selectedDevice);
  }

  handleinstructionProgress(step: INSTRUCTION_PROGRESS) {
    if (step === 0) {
      this.props.history.push(SCREENS.DESIGN.route);
    } else {
      this.setState({ instructionProgress: step });
    }
  }

  renderAvailableDeviceList() {
    return (
      <Segment basic>
        <List divided relaxed inverted>
          {this.props.availableDevices.map(device => (
            <List.Item className={styles.deviceItem} key={device.id}>
              <List.Icon
                link
                name={
                  this.state.selectedDevice === device
                    ? 'check circle outline'
                    : 'circle outline'
                }
                size="large"
                verticalAlign="middle"
                onClick={() => this.setState({ selectedDevice: device })}
              />
              <List.Content>
                <List.Header>{ConnectModal.getDeviceName(device)}</List.Header>
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
          {/* <Modal.Content image>
            <Image src={blake} size="tiny" centered />
          </Modal.Content> */}
          <Modal.Content className={styles.searchingText}>
            Searching for available headset(s)...
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.props.connectionStatus === CONNECTION_STATUS.CONNECTING) {
      return (
        <React.Fragment>
          {/* <Modal.Content image>
            <Image src={blake} size="tiny" centered />
          </Modal.Content> */}
          <Modal.Content className={styles.searchingText}>
            Connecting to{' '}
            {ConnectModal.getDeviceName(this.state.selectedDevice)}
            ...
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (this.state.instructionProgress === INSTRUCTION_PROGRESS.TURN_ON) {
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
                  onClick={() => this.handleinstructionProgress(0)}
                >
                  Back
                </Button>
              </Grid.Column>
              <Grid.Column>
                <Button
                  fluid
                  className={styles.primaryButton}
                  onClick={() =>
                    this.handleinstructionProgress(
                      INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY
                    )
                  }
                >
                  Next
                </Button>
              </Grid.Column>
            </Grid>
          </Modal.Content>
        </React.Fragment>
      );
    }
    if (
      this.state.instructionProgress ===
      INSTRUCTION_PROGRESS.COMPUTER_CONNECTABILITY
    ) {
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
                  onClick={() =>
                    this.handleinstructionProgress(INSTRUCTION_PROGRESS.TURN_ON)
                  }
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
                  onClick={() => this.handleinstructionProgress(1)}
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
              onClick={() => this.handleinstructionProgress(1)}
            >
              Don&#39;t see your device?
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
