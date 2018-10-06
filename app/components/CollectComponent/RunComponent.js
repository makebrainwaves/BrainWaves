// @flow
import React, { Component } from 'react';
import { Grid, Button, Segment, Header, Divider } from 'semantic-ui-react';
import { Experiment } from 'jspsych-react';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom';
import styles from '../styles/common.css';
import InputModal from '../InputModal';
import { injectEmotivMarker } from '../../utils/eeg/emotiv';
import { injectMuseMarker } from '../../utils/eeg/muse';
import callbackHTMLDisplay from '../../utils/jspsych/plugins/callback-html-display';
import callbackImageDisplay from '../../utils/jspsych/plugins/callback-image-display';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import {
  parseTimeline,
  instantiateTimeline,
  getImages
} from '../../utils/jspsych/functions';
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';

interface Props {
  type: ?EXPERIMENTS;
  title: string;
  isRunning: boolean;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: {};
  subject: string;
  session: number;
  deviceType: DEVICES;
  experimentActions: Object;
}

interface State {
  isInputModalOpen: boolean;
}

export default class Run extends Component<Props, State> {
  props: Props;
  state: State;
  handleSubjectEntry: (Object, Object) => void;
  handleSessionEntry: (Object, Object) => void;
  handleStartExperiment: () => void;
  handleTimeline: () => void;
  handleCloseInputModal: () => void;
  handleClean: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      isInputModalOpen: props.subject.length === 0
    };
    this.handleSubjectEntry = debounce(this.handleSubjectEntry, 500).bind(this);
    this.handleSessionEntry = debounce(this.handleSessionEntry, 500).bind(this);
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.handleTimeline = this.handleTimeline.bind(this);
    this.handleCloseInputModal = this.handleCloseInputModal.bind(this);
    // this.handleClean = this.handleClean.bind(this);
  }

  componentDidMount() {
    if (this.props.mainTimeline.length <= 0) {
      this.props.experimentActions.loadDefaultTimeline();
    }
  }

  handleSubjectEntry(event: Object, data: Object) {
    this.props.experimentActions.setSubject(data.value);
  }

  handleSessionEntry(event: Object, data: Object) {
    this.props.experimentActions.setSession(parseFloat(data.value));
  }

  handleStartExperiment() {
    this.props.experimentActions.start();
  }

  handleCloseInputModal(name: string) {
    this.props.experimentActions.setSubject(name);
    this.setState({ isInputModalOpen: false });
  }

  handleTimeline() {
    const injectionFunction =
      this.props.deviceType === 'MUSE' ? injectMuseMarker : injectEmotivMarker;

    const timeline = instantiateTimeline(
      parseTimeline(
        this.props.params,
        this.props.mainTimeline,
        this.props.trials,
        this.props.timelines
      ),
      (value, time) => injectionFunction(value, time), // event callback
      null, // start callback
      this.props.experimentActions.stop, // stop callback
      this.props.params.showProgessBar
    );
    return timeline;
  }

  handleImages() {
    return getImages(this.props.params);
  }

  renderCleanButton() {
    if (this.props.session > 1) {
      return (
        <Grid.Column>
          <Link to="/clean">
            <Button fluid secondary>
              Clean Data
            </Button>
          </Link>
        </Grid.Column>
      );
    }
  }

  renderExperiment() {
    if (!this.props.isRunning) {
      return (
        <div className={styles.mainContainer}>
          <Segment
            basic
            textAlign="left"
            className={styles.descriptionContainer}
          >
            <Header as="h1">{this.props.type}</Header>
            <Segment basic className={styles.infoSegment}>
              Subject Name: <b>{this.props.subject}</b>
              <Button
                basic
                circular
                size="huge"
                icon="edit"
                className={styles.closeButton}
                onClick={() => this.setState({ isInputModalOpen: true })}
              />
            </Segment>
            <Segment basic className={styles.infoSegment}>
              Session Number: <b>{this.props.session}</b>
            </Segment>
            <Divider hidden section />
            <Grid textAlign="center" columns="equal">
              <Grid.Column>
                <Button fluid primary onClick={this.handleStartExperiment}>
                  Run Experiment
                </Button>
              </Grid.Column>
              {this.renderCleanButton()}
            </Grid>
          </Segment>
        </div>
      );
    }
    return (
      <Experiment
        settings={{
          timeline: this.handleTimeline(),
          show_progress_bar: this.props.params.showProgessBar,
          auto_update_progress_bar: false,
          on_finish: this.props.experimentActions.stop,
          preload_images: this.handleImages()
        }}
        plugins={{
          'callback-image-display': callbackImageDisplay,
          'callback-html-display': callbackHTMLDisplay
        }}
      />
    );
  }

  render() {
    return (
      <div className={styles.mainContainer} data-tid="container">
        <Grid columns={1} divided relaxed>
          <Grid.Row centered>{this.renderExperiment()}</Grid.Row>
        </Grid>
        <InputModal
          open={this.state.isInputModalOpen}
          onClose={this.handleCloseInputModal}
          header="Enter Subject Name"
        />
      </div>
    );
  }
}
