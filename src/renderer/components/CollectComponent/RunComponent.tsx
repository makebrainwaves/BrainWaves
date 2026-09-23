import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Link } from 'react-router-dom';
import InputCollect from '../InputCollect';
import { injectMarker } from '../../utils/eeg';
import { sendMarker } from '../../utils/eeg/lslBridge';
import {
  EXPERIMENTS,
  CONNECTION_STATUS,
  SCREENS,
  PLOTTING_INTERVAL,
} from '../../constants/constants';
import { ExperimentRuntime } from '../ExperimentRuntime';
import { nextFreeSession } from '../../utils/filesystem/storage';
import { getExperimentFromType } from '../../utils/labjs/functions';
import { RunProgressContext } from '../../containers/AppShellContainer';
import {
  ExperimentParameters,
  ExperimentObject,
  SignalQualityData,
} from '../../constants/interfaces';
import { ExperimentActions as globalExperimentActions } from '../../actions';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';

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
  signalQualityObservable?: Observable<SignalQualityData> | null;
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
  signalQualityObservable,
}) => {
  const [isInputCollectOpen, setIsInputCollectOpen] = useState(
    subject.length === 0
  );
  // A run finished this session — show a completion panel that points forward to
  // Clean, instead of silently dropping back to the identical pre-run landing.
  const [hasFinished, setHasFinished] = useState(false);

  // Checks passed; waiting for the participant to press SPACE. Nothing is
  // recorded until then.
  const [isArmed, setIsArmed] = useState(false);
  const reportProgress = useContext(RunProgressContext);
  const { pacing } = getExperimentFromType(type).text.protocol;

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

    const freeSession = await nextFreeSession(title, subject, group, session);
    if (freeSession !== session) {
      const { response } = await window.electronAPI.showMessageBox({
        type: 'warning',
        message: `Session ${session} for ${subject} (${group}) is already recorded.`,
        detail: `Record this run as session ${freeSession} to keep the earlier data, or replace session ${session}. Replacing deletes the earlier recording.`,
        buttons: [
          'Cancel',
          `Record as session ${freeSession}`,
          `Replace session ${session}`,
        ],
        defaultId: 1,
        cancelId: 0,
      });
      if (response === 0) return;
      if (response === 1) ExperimentActions.SetSession(freeSession);
    }
    setIsArmed(true);
  }, [
    subject,
    group,
    session,
    title,
    isEEGEnabled,
    connectionStatus,
    ExperimentActions,
  ]);

  useEffect(() => {
    if (!isArmed) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        setIsArmed(false);
        ExperimentActions.Start();
      } else if (event.code === 'Escape') {
        setIsArmed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isArmed, ExperimentActions]);

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
    <div className="h-screen p-[3%] bg-app" data-tid="container">
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

        {!isRunning && !hasFinished && isArmed && (
          <div
            role="dialog"
            aria-label="Press space to begin"
            className="flex h-full flex-col items-center justify-center gap-8 text-center"
          >
            <p className="text-[15px] font-bold uppercase tracking-[0.5px] text-ink-muted">
              Participant&apos;s turn · hands on the keyboard
            </p>
            <h1 className="m-0 text-[44px]">Press SPACE to begin</h1>
            <kbd
              aria-hidden
              className="flex h-[72px] w-[360px] items-end justify-center rounded-xl border-2 border-b-[6px] border-ink bg-white pb-3 text-[16px] font-bold tracking-[1px] text-ink-muted"
            >
              space
            </kbd>
            <p className="text-[15px] text-ink-muted">
              Press Esc to go back without recording.
            </p>
          </div>
        )}

        {!isRunning && !hasFinished && !isArmed && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <h2 className="m-0 text-lg font-semibold">Ready to run</h2>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border border-[#ececf1] bg-white p-4">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[17px]">
                    <dt className="text-ink-muted">Participant</dt>
                    <dd className="m-0 font-bold">{subject || '—'}</dd>
                    <dt className="text-ink-muted">Group</dt>
                    <dd className="m-0 font-bold">{group || '—'}</dd>
                    <dt className="text-ink-muted">Session</dt>
                    <dd className="m-0 font-bold">{session}</dd>
                  </dl>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => setIsInputCollectOpen(true)}
                  >
                    ✏ Edit participant, group or session
                  </Button>
                </div>
                <ul className="m-0 list-disc space-y-1 pl-5 text-[15px]">
                  {pacing && <li>{pacing}</li>}
                  {isEEGEnabled && (
                    <li>
                      Remain still and avoid talking while trials are running.
                    </li>
                  )}
                </ul>
                {isEEGEnabled &&
                connectionStatus === CONNECTION_STATUS.CONNECTED &&
                signalQualityObservable ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Signal quality</p>
                    <SignalQualityIndicatorComponent
                      signalQualityObservable={signalQualityObservable}
                      plottingInterval={PLOTTING_INTERVAL}
                    />
                  </div>
                ) : null}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStartExperiment}
                  disabled={!subject}
                >
                  Run &amp; record
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isRunning && (
          <div className="h-full w-full">
            <ExperimentRuntime
              type={type}
              title={title}
              experimentObject={experimentObject}
              params={params}
              eventCallback={eventCallback}
              onFinish={onFinish}
              onProgress={reportProgress}
            />
          </div>
        )}
      </div>
      <InputCollect
        key={`${subject}-${group}-${session}`}
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
