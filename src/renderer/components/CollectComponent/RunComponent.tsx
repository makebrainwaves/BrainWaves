import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/common.module.css';
import InputCollect from '../InputCollect';
import { injectEmotivMarker } from '../../utils/eeg/emotiv';
import { injectMuseMarker } from '../../utils/eeg/muse';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { ExperimentWindow } from '../ExperimentWindow';
import { checkFileExists, getImages } from '../../utils/filesystem/storage';
import { ExperimentParameters } from '../../constants/interfaces';
import { ExperimentActions as globalExperimentActions } from '../../actions';

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
    const fileExists = await checkFileExists(title, subject, filename);
    if (fileExists) {
      const options = {
        buttons: ['No', 'Yes'],
        message:
          'You already have a file with the same name. If you continue the experiment, the current file will be deleted. Do you really want to overwrite the data?',
      };
      const response = await window.electronAPI.showMessageBox(options);
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
      <div className={`flex flex-wrap gap-4 ${styles.experimentContainer}`}>
        <div className="flex items-center w-full gap-4 justify-center">
          {!isRunning && (
            <div className={styles.mainContainer}>
              <div
                className={`text-left ${styles.descriptionContainer}`}
              >
                <h1 className="text-2xl font-bold">{title}</h1>
                <button
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors font-medium"
                  onClick={() => setIsInputCollectOpen(true)}
                >
                  ✏️
                </button>
                <div className={`p-4 ${styles.infoSegment}`}>
                  Subject ID: <b>{subject}</b>
                </div>

                <div className={`p-4 ${styles.infoSegment}`}>
                  Group Name: <b>{group}</b>
                </div>

                <div className={`p-4 ${styles.infoSegment}`}>
                  Session Number: <b>{session}</b>
                </div>

                <hr className="my-4 border-gray-200" />
                <div className="flex flex-wrap gap-4 text-center">
                  <div className="flex-1">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleStartExperiment}
                      disabled={!subject}
                    >
                      Run Experiment
                    </button>
                  </div>
                </div>
              </div>
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
        </div>
      </div>
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
