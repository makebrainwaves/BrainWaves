import React, { Component } from 'react';
import {
  Grid,
  Segment,
  Button,
  List,
  Header,
  Sidebar,
} from 'semantic-ui-react';
import Mousetrap from 'mousetrap';
import ViewerComponent from '../ViewerComponent';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import PreviewButton from '../PreviewButtonComponent';
import { HelpSidebar, HelpButton } from './HelpSidebar';
import styles from '../styles/collect.css';
import { getExperimentFromType } from '../../utils/labjs/functions';
import { ExperimentActions, DeviceActions } from '../../actions';
import {
  DEVICES,
  DEVICE_AVAILABILITY,
  EXPERIMENTS,
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
} from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';

interface Props {
  ExperimentActions: typeof ExperimentActions;
  connectedDevice: Record<string, any>;
  signalQualityObservable: any | null | undefined;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  availableDevices: Array<any>;
  type: EXPERIMENTS;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  group: string;
  session: number;
  title: string;
  openRunComponent: () => void;
}

interface State {
  isPreviewing: boolean;
  isSidebarVisible: boolean;
}

export default class PreTestComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isPreviewing: false,
      isSidebarVisible: true,
    };
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.endPreview = this.endPreview.bind(this);
  }

  componentDidMount() {
    Mousetrap.bind('esc', this.props.ExperimentActions.Stop);
  }

  componentWillUnmount() {
    Mousetrap.unbind('esc');
  }

  endPreview() {
    this.setState({ isPreviewing: false });
  }

  handlePreview(e) {
    e.target.blur();
    this.setState((prevState) => ({
      ...prevState,
      isSidebarVisible: false,
      isPreviewing: !prevState.isPreviewing,
    }));
  }

  handleSidebarToggle() {
    this.setState((prevState) => ({
      ...prevState,
      isSidebarVisible: !prevState.isSidebarVisible,
    }));
  }

  renderSignalQualityOrPreview() {
    if (this.state.isPreviewing) {
      return (
        <PreviewExperimentComponent
          {...getExperimentFromType(this.props.type)}
          isPreviewing={this.state.isPreviewing}
          onEnd={this.endPreview}
          type={this.props.type}
          params={this.props.params}
          title={this.props.title}
        />
      );
    }
    return (
      <Segment basic>
        <SignalQualityIndicatorComponent
          signalQualityObservable={this.props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
        <Segment basic>
          <List>
            <List.Item>
              <List.Icon name="circle" className={styles.greatSignal} />
              <List.Content>Strong Signal</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="circle" className={styles.okSignal} />
              <List.Content>Mediocre signal</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="circle" className={styles.badSignal} />
              <List.Content>Weak Signal</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="circle" className={styles.noSignal} />
              <List.Content>No Signal</List.Content>
            </List.Item>
          </List>
        </Segment>
      </Segment>
    );
  }

  renderHelpButton() {
    if (!this.state.isSidebarVisible) {
      return <HelpButton onClick={this.handleSidebarToggle} />;
    }
  }

  render() {
    return (
      <Sidebar.Pushable as={Segment} className={styles.preTestPushable} basic>
        <Sidebar
          width="wide"
          direction="right"
          as={Segment}
          visible={this.state.isSidebarVisible}
        >
          <HelpSidebar handleClose={this.handleSidebarToggle} />
        </Sidebar>
        <Sidebar.Pusher>
          <Grid
            className={styles.preTestContainer}
            columns="equal"
            textAlign="center"
            verticalAlign="middle"
          >
            <Grid.Row columns="equal">
              <Grid.Column>
                <Header as="h1" floated="left">
                  Collect
                </Header>
              </Grid.Column>
              <Grid.Column floated="right">
                <PreviewButton
                  isPreviewing={this.state.isPreviewing}
                  onClick={(e) => this.handlePreview(e)}
                />
                <Button
                  primary
                  disabled={
                    this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED
                  }
                  onClick={this.props.openRunComponent}
                >
                  Run & Record Experiment
                </Button>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={8} className={styles.previewEEGWindow}>
                {this.renderSignalQualityOrPreview()}
              </Grid.Column>
              <Grid.Column width={8}>
                <ViewerComponent
                  signalQualityObservable={this.props.signalQualityObservable}
                  deviceType={this.props.deviceType}
                  plottingInterval={PLOTTING_INTERVAL}
                />
                {this.renderHelpButton()}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    );
  }
}
