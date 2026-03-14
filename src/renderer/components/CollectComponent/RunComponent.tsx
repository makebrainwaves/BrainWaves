import React, { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import InputCollect from '../InputCollect';
import { injectEmotivMarker } from '../../utils/eeg/emotiv';
import { injectMuseMarker } from '../../utils/eeg/muse';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { ExperimentWindow } from '../ExperimentWindow';
import { checkFileExists, getImages } from '../../utils/filesystem/storage';
import {
  ExperimentParameters,
  ExperimentObject,
} from '../../constants/interfaces';
import { ExperimentActions as globalExperimentActions } from '../../actions';

interface Props {
  type: EXPERIMENTS;
  title: string;
  isRunning: boolean;
  params: ExperimentParameters;
  subject: string;
  experimentObject: ExperimentObject;
  group: string;
  session: number;
  deviceType: DEVICES;
  isEEGEnabled: boolean;
  ExperimentActions: typeof globalExperimentActions;
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
    <div
      className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]"
      data-tid="container"
    >
      <div className="h-full">
        {!isRunning && (
          <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
            <div className="text-left">
              <h1>{title}</h1>
              <button
                className="flex justify-end w-full"
                onClick={() => setIsInputCollectOpen(true)}
                aria-label="Edit"
              >
                ✏
              </button>
              <div>
                Subject ID: <b>{subject}</b>
              </div>
              <div>
                Group Name: <b>{group}</b>
              </div>
              <div>
                Session Number: <b>{session}</b>
              </div>
              <div className="mt-6">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleStartExperiment}
                  disabled={!subject}
                >
                  Run Experiment
                </Button>
              </div>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="h-full w-full">
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
      <InputCollect
        open={isInputCollectOpen}
        onClose={handleCloseInputCollect}
        onExit={() => setIsInputCollectOpen(false)}
        header="Enter Data"
        data={{ subject, group, session }}
      />
    </div>
  );
};

export default Run;
