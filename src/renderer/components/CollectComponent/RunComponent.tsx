import React, { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import InputCollect from '../InputCollect';
import { injectMarker } from '../../utils/eeg';
import { sendMarker } from '../../utils/eeg/lslBridge';
import {
  EXPERIMENTS,
  CONNECTION_STATUS,
  SCREENS,
} from '../../constants/constants';
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
  isEEGEnabled: boolean;
  connectionStatus: CONNECTION_STATUS;
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
  isEEGEnabled,
  connectionStatus,
  ExperimentActions,
}) => {
  const [isInputCollectOpen, setIsInputCollectOpen] = useState(
    subject.length === 0
  );
  // A run finished this session — show a completion panel that points forward to
  // Clean, instead of silently dropping back to the identical pre-run landing.
  const [hasFinished, setHasFinished] = useState(false);

  const handleStartExperiment = useCallback(async () => {
    // Warn before a run that won't capture brain data: EEG turned off, or on
    // but no device connected. Either way it silently records behavior only.
    const eegConnected =
      isEEGEnabled && connectionStatus === CONNECTION_STATUS.CONNECTED;
    if (!eegConnected) {
      const message = isEEGEnabled
        ? 'No EEG device is connected. This run will record responses but no brain data. Continue anyway?'
        : 'EEG is disabled. This run will record responses but no brain data. Continue anyway?';
      const response = await window.electronAPI.showMessageBox({
        buttons: ['No', 'Yes'],
        message,
      });
      if (response.response !== 1) {
        return;
      }
    }

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
  }, [
    subject,
    group,
    session,
    title,
    isEEGEnabled,
    connectionStatus,
    ExperimentActions,
  ]);

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
    (event: number, time: number) => {
      if (isEEGEnabled) {
        // Device-agnostic: dispatches to whichever driver is connected (Muse or
        // Neurosity), so markers reach the recorded CSV regardless of device.
        injectMarker(event, time);
        // Goes through lslBridge so it no-ops (no IPC) when liblsl is unavailable.
        sendMarker({
          label: String(event),
          rendererTimestamp: performance.now(),
        });
      }
    },
    [isEEGEnabled]
  );

  const onFinish = useCallback(
    (csv) => {
      ExperimentActions.Stop({ data: csv });
      setHasFinished(true);
    },
    [ExperimentActions]
  );

  const handleRunAgain = useCallback(() => {
    setHasFinished(false);
  }, []);

  return (
    <div
      className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]"
      data-tid="container"
    >
      <div className="h-full">
        {!isRunning && hasFinished && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <h1 className="m-0">Recording complete 🎉</h1>
            <p className="text-gray-600">
              Saved <b>{subject}</b>&apos;s data. Ready to clean and analyze it?
            </p>
            <div className="flex gap-3 mt-2">
              <Button asChild variant="default">
                <Link to={SCREENS.CLEAN.route}>Clean your data →</Link>
              </Button>
              <Button variant="secondary" onClick={handleRunAgain}>
                Run again
              </Button>
            </div>
          </div>
        )}

        {!isRunning && !hasFinished && (
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
