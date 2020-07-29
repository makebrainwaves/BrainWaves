import { remote } from 'electron';
import React, { Component } from 'react';
import { Grid, Button, Segment, Header, Divider } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/common.css';
import InputCollect from '../InputCollect';
import { injectEmotivMarker } from '../../utils/eeg/emotiv';
import { injectMuseMarker } from '../../utils/eeg/muse';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { ExperimentWindow } from '../../utils/labjs';
import { checkFileExists, getImages } from '../../utils/filesystem/storage';
import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';
import { ExperimentActions } from '../../actions';

const { dialog } = remote;

interface Props {
  type: EXPERIMENTS | null | undefined;
  title: string;
  isRunning: boolean;
  params: ExperimentParameters;
  mainTimeline: MainTimeline;
  trials: {
    [key: string]: Trial;
  };
  timelines: {};
  subject: string;
  group: string;
  session: number;
  deviceType: DEVICES;
  paradigm: EXPERIMENTS;
  isEEGEnabled: boolean;
  ExperimentActions: typeof ExperimentActions;
}

interface State {
  isInputCollectOpen: boolean;
}

export default class Run extends Component<Props, State> {
  // insertLabJsCallback: () => void;
  // handleCloseInputCollect: (string, string, number) => void;
  // handleClean: () => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      isInputCollectOpen: props.subject.length === 0
    };
    this.handleStartExperiment = this.handleStartExperiment.bind(this);
    this.insertLabJsCallback = this.insertLabJsCallback.bind(this);
    this.handleCloseInputCollect = this.handleCloseInputCollect.bind(this);
  }

  componentDidMount() {
    if (this.props.mainTimeline.length <= 0) {
      this.props.ExperimentActions.LoadDefaultTimeline();
    }
  }

  async handleStartExperiment() {
    const filename = `${this.props.subject}-${this.props.group}-${this.props.session}-behavior.csv`;
    const { subject, title } = this.props;
    const fileExists = checkFileExists(title, subject, filename);
    if (fileExists) {
      const options = {
        buttons: ['No', 'Yes'],
        message:
          'You already have a file with the same name. If you continue the experiment, the current file will be deleted. Do you really want to overwrite the data?'
      };
      const response = await dialog.showMessageBox(options);
      if (response.response === 1) {
        this.props.ExperimentActions.Start();
      }
    }
  }

  handleCloseInputCollect(subject: string, group: string, session: number) {
    this.props.ExperimentActions.SetSubject(subject);
    this.props.ExperimentActions.SetGroup(group);
    // error here
    this.props.ExperimentActions.SetSession(session);
    this.setState({ isInputCollectOpen: false });
  }

  insertLabJsCallback() {
    let injectionFunction = (value: any, time: number) => {};
    if (this.props.isEEGEnabled) {
      injectionFunction =
        this.props.deviceType === 'MUSE'
          ? injectMuseMarker
          : injectEmotivMarker;
    }
    return injectionFunction;
  }

  handleImages() {
    return getImages(this.props.params);
  }

  renderCleanButton() {
    if (this.props.session > 1 && this.props.isEEGEnabled) {
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
            vertical
          >
            <Header as="h1">{this.props.title}</Header>
            <Button
              basic
              circular
              size="huge"
              icon="edit"
              className={styles.closeButton}
              onClick={() => this.setState({ isInputCollectOpen: true })}
            />
            <Segment basic className={styles.infoSegment}>
              Subject ID: <b>{this.props.subject}</b>
            </Segment>

            <Segment basic className={styles.infoSegment}>
              Group Name: <b>{this.props.group}</b>
            </Segment>

            <Segment basic className={styles.infoSegment}>
              Session Number: <b>{this.props.session}</b>
            </Segment>

            <Divider hidden section />
            <Grid textAlign="center" columns="equal">
              <Grid.Column>
                <Button
                  fluid
                  primary
                  onClick={this.handleStartExperiment}
                  disabled={!this.props.subject}
                >
                  Run Experiment
                </Button>
              </Grid.Column>
            </Grid>
          </Segment>
        </div>
      );
    }
    return (
      <div className={styles.experimentWindow}>
        <ExperimentWindow
          settings={{
            title: this.props.title,
            script: this.props.paradigm,
            params: this.props.params,
            eventCallback: this.insertLabJsCallback(),
            on_finish: csv => {
              this.props.ExperimentActions.Stop({ data: csv });
            }
          }}
        />
      </div>
    );
  }

  render() {
    return (
      <div className={styles.mainContainer} data-tid="container">
        <Grid
          columns={1}
          divided
          relaxed
          className={styles.experimentContainer}
        >
          <Grid.Row centered>{this.renderExperiment()}</Grid.Row>
        </Grid>
        <InputCollect
          open={this.state.isInputCollectOpen}
          onClose={this.handleCloseInputCollect}
          onExit={() => this.setState({ isInputCollectOpen: false })}
          header="Enter Data"
          data={{
            subject: this.props.subject,
            group: this.props.group,
            session: this.props.session
          }}
        />
      </div>
    );
  }
}
