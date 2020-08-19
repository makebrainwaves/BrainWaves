import React, { Component } from 'react';
import {
  Grid,
  Button,
  Header,
  Segment,
  Image,
  Divider,
} from 'semantic-ui-react';
import { Observable } from 'rxjs';
import { History } from 'history';
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../constants/constants';
import eegImage from '../assets/common/EEG.png';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import ViewerComponent from './ViewerComponent';
import ConnectModal from './CollectComponent/ConnectModal';
import styles from './styles/common.css';
import { DeviceActions } from '../actions';
import { SignalQualityData, PipesEpoch } from '../constants/interfaces';

interface Props {
  history: History;
  connectedDevice: Record<string, any>;
  signalQualityObservable: Observable<PipesEpoch>;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<any>;
}

interface State {
  isConnectModalOpen: boolean;
}

export default class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isConnectModalOpen: false,
    };
    this.handleConnectModalClose = this.handleConnectModalClose.bind(this);
    this.handleStartConnect = this.handleStartConnect.bind(this);
    this.handleStopConnect = this.handleStopConnect.bind(this);
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
    this.props.DeviceActions.SetDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleStopConnect() {
    this.props.DeviceActions.DisconnectFromDevice(this.props.connectedDevice);
    this.setState({ isConnectModalOpen: false });
    this.props.DeviceActions.SetDeviceAvailability(DEVICE_AVAILABILITY.NONE);
  }

  handleConnectModalClose() {
    this.setState({ isConnectModalOpen: false });
  }

  render() {
    return (
      <Grid
        stretched
        relaxed
        padded
        className={styles.contentGrid}
        style={{ alignItems: 'center' }}
      >
        {this.props.connectionStatus === CONNECTION_STATUS.CONNECTED && (
          <Grid.Row>
            <Grid.Column stretched width={6}>
              <SignalQualityIndicatorComponent
                signalQualityObservable={this.props.signalQualityObservable}
                plottingInterval={PLOTTING_INTERVAL}
              />
            </Grid.Column>
            <Grid.Column stretched width={10}>
              <div className={styles.disconnectButtonContainer}>
                <Button secondary onClick={this.handleStopConnect}>
                  Disconnect EEG Device
                </Button>
              </div>
              <ViewerComponent
                signalQualityObservable={this.props.signalQualityObservable}
                deviceType={this.props.deviceType}
                plottingInterval={PLOTTING_INTERVAL}
              />
            </Grid.Column>
          </Grid.Row>
        )}
        {this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED && (
          <Grid.Row stretched>
            <Grid.Column stretched width={5}>
              <Segment basic>
                <Image src={eegImage} />
              </Segment>
            </Grid.Column>

            <Grid.Column stretched width={11}>
              <Segment basic>
                <Header as="h1">Explore Raw EEG</Header>
                <Divider />
                <p>
                  Connect directly to an EEG device and view raw streaming data
                </p>
                <Button primary onClick={this.handleStartConnect}>
                  Connect
                </Button>
              </Segment>
            </Grid.Column>
            <ConnectModal
              history={this.props.history}
              open={this.state.isConnectModalOpen}
              onClose={this.handleConnectModalClose}
              connectedDevice={this.props.connectedDevice}
              signalQualityObservable={this.props.signalQualityObservable}
              deviceType={this.props.deviceType}
              deviceAvailability={this.props.deviceAvailability}
              connectionStatus={this.props.connectionStatus}
              DeviceActions={this.props.DeviceActions}
              availableDevices={this.props.availableDevices}
            />
          </Grid.Row>
        )}
      </Grid>
    );
  }
}
