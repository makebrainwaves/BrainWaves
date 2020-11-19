import { remote } from 'electron';
import React, { Component, useCallback, useState } from 'react';
import { Grid, Button, Segment, Header, Divider } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/common.css';
import InputCollect from '../InputCollect';
import { injectEmotivMarker } from '../../utils/eeg/emotiv';
import { injectMuseMarker } from '../../utils/eeg/muse';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { ExperimentWindow } from '../ExperimentWindow';
import { checkFileExists, getImages } from '../../utils/filesystem/storage';
import { ExperimentParameters } from '../../constants/interfaces';
import { ExperimentActions as globalExperimentActions } from '../../actions';

const { dialog } = remote;

interface Props {
  type: EXPERIMENTS;
  title: string;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  experimentObject: any;
  group: string;
  session: number;
  deviceType: DEVICES;
  isEEGEnabled: boolean;
  ExperimentActions: typeof globalExperimentActions;
}

interface State {
  isInputCollectOpen: boolean;
}

const Run: React.FC<Props> = ({
  type,
  title,
  isRunning,
  params,
  subject,
  experimentObject,
  group,
  session,
  deviceType,
  isEEGEnabled,
  ExperimentActions,
}) => {
  const [isInputCollectOpen, setIsInputCollectOpen] = useState(
    subject.length === 0
  );

  const handleStartExperiment = useCallback(async () => {
    const filename = `${subject}-${group}-${session}-behavior.csv`;
    const fileExists = checkFileExists(title, subject, filename);
    if (fileExists) {
      const options = {
        buttons: ['No', 'Yes'],
        message:
          'You already have a file with the same name. If you continue the experiment, the current file will be deleted. Do you really want to overwrite the data?',
      };
      const response = await dialog.showMessageBox(options);
      if (response.response === 1) {
        ExperimentActions.Start();
      }
    } else {
      ExperimentActions.Start();
    }
  }, [subject, group, session, title, ExperimentActions]);

  const handleCloseInputCollect = useCallback(
    (newSubject: string, newGroup: string, newSession: number) => {
      ExperimentActions.SetSubject(newSubject);
      ExperimentActions.SetGroup(newGroup);
      ExperimentActions.SetSession(newSession);
      setIsInputCollectOpen(false);
    },
    [ExperimentActions]
  );

  const eventCallback = useCallback(
    (event: string, time: number) => {
      if (isEEGEnabled) {
        if (deviceType === 'MUSE') {
          injectMuseMarker(event, time);
        } else {
          injectEmotivMarker(event, time);
        }
      }
    },
    [isEEGEnabled, deviceType]
  );

  const onFinish = useCallback(
    (csv) => {
      ExperimentActions.Stop({ data: csv });
    },
    [ExperimentActions]
  );

  return (
    <div className={styles.mainContainer} data-tid="container">
      <Grid columns={1} divided relaxed className={styles.experimentContainer}>
        <Grid.Row centered>
          {!isRunning && (
            <div className={styles.mainContainer}>
              <Segment
                basic
                textAlign="left"
                className={styles.descriptionContainer}
                vertical
              >
                <Header as="h1">{title}</Header>
                <Button
                  basic
                  circular
                  size="huge"
                  icon="edit"
                  className={styles.closeButton}
                  onClick={() => setIsInputCollectOpen(true)}
                />
                <Segment basic className={styles.infoSegment}>
                  Subject ID: <b>{subject}</b>
                </Segment>

                <Segment basic className={styles.infoSegment}>
                  Group Name: <b>{group}</b>
                </Segment>

                <Segment basic className={styles.infoSegment}>
                  Session Number: <b>{session}</b>
                </Segment>

                <Divider hidden section />
                <Grid textAlign="center" columns="equal">
                  <Grid.Column>
                    <Button
                      fluid
                      primary
                      onClick={handleStartExperiment}
                      disabled={!subject}
                    >
                      Run Experiment
                    </Button>
                  </Grid.Column>
                </Grid>
              </Segment>
            </div>
          )}

          {isRunning && (
            <div className={styles.experimentWindow}>
              <ExperimentWindow
                title={title}
                experimentObject={experimentObject}
                params={params}
                eventCallback={eventCallback}
                onFinish={onFinish}
              />
            </div>
          )}
        </Grid.Row>
      </Grid>
      <InputCollect
        open={isInputCollectOpen}
        onClose={handleCloseInputCollect}
        onExit={() => setIsInputCollectOpen(false)}
        header="Enter Data"
        data={{
          subject,
          group,
          session,
        }}
      />
    </div>
  );
};

export default Run;
