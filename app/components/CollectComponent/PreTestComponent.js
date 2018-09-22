import React, { Component } from 'react';
import { isNil } from 'lodash';
import {
  Grid,
  Segment,
  Button,
  List,
  Header,
  Sidebar
} from 'semantic-ui-react';
import ViewerComponent from '../ViewerComponent';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import HelpSidebar from './HelpSidebar';
import styles from '../styles/collect.css';
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS
} from '../../constants/constants';

interface Props {
  experimentActions: Object;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  experimentActions: Object;
  availableDevices: Array<any>;
  type: ?EXPERIMENTS;
  isRunning: boolean;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
  // dir: ?string,
  subject: string;
  session: number;
  openRunComponent: () => void;
}

interface State {
  isPreviewing: boolean;
  isSidebarVisible: boolean;
}

export default class PreTestComponent extends Component<Props, State> {
  props: Props;
  state: State;
  handlePreview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      isPreviewing: false,
      isSidebarVisible: false
    };
    this.handlePreview = this.handlePreview.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
  }

  handlePreview() {
    if (isNil(this.props.mainTimeline)) {
      this.props.experimentActions.loadDefaultTimeline();
    }
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  handleSidebarToggle() {
    this.setState({ isSidebarVisible: !this.state.isSidebarVisible });
  }

  renderSignalQualityOrPreview() {
    if (this.state.isPreviewing) {
      return (
        <PreviewExperimentComponent
          isPreviewing={this.state.isPreviewing}
          params={this.props.params}
          mainTimeline={this.props.mainTimeline}
          trials={this.props.trials}
          timelines={this.props.timelines}
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

  renderPreviewButton() {
    if (!this.state.isPreviewing) {
      return (
        <Button secondary onClick={this.handlePreview}>
          Preview Experiment
        </Button>
      );
    }
    return (
      <Button negative onClick={this.handlePreview}>
        Stop Preview
      </Button>
    );
  }

  renderHelpButton() {
    if (!this.state.isSidebarVisible) {
      return (
        <Button
          circular
          icon="question"
          className={styles.helpButton}
          floated="right"
          onClick={this.handleSidebarToggle}
        />
      );
    }
  }

  render() {
    return (
      <Sidebar.Pushable as={Segment} basic>
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
                {this.renderPreviewButton()}
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
              <Grid.Column stretched width={6}>
                {this.renderSignalQualityOrPreview()}
              </Grid.Column>
              <Grid.Column width={10}>
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
