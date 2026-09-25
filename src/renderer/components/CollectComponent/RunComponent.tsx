import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Observable } from 'rxjs';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';
import RunResult from './RunResult';
import InputCollect from '../InputCollect';
import { emitMarker } from '../../utils/eeg';
import { resolveMarkerRegistry } from '../../utils/eeg/markerRegistry';
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
import type { RunOutcome } from '../../actions/experimentActions';
import SignalQualityIndicatorComponent from '../SignalQualityIndicatorComponent';

interface Props {
  type: EXPERIMENTS;
  title: string;
  isRunning: boolean;
  /** End early was asked for; the runtime unmounts and reports what it recorded. */
  isEnding: boolean;
  runOutcome: RunOutcome | null;
  /** The run captures EEG (EEG on and a headset connected), not just key presses. */
  recordsEEG: boolean;
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
  isEnding,
  runOutcome,
  recordsEEG,
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
  const navigate = useNavigate();
  // 'armed': checks passed, waiting for SPACE; nothing is recorded yet.
  // 'starting': SPACE pressed, Start dispatched; the gate stays up until the
  // run is live so the Ready card doesn't flash, and SPACE can't start twice.
  const [gate, setGate] = useState<'off' | 'armed' | 'starting'>('off');
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
        detail: `This run will be recorded as session ${freeSession}, so the earlier recording is kept.`,
        buttons: ['Cancel', `Record as session ${freeSession}`],
        defaultId: 1,
        cancelId: 0,
      });
      if (response !== 1) return;
      ExperimentActions.SetSession(freeSession);
    }
    setGate('armed');
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
    if (isRunning) setGate('off');
  }, [isRunning]);

  useEffect(() => {
    if (gate !== 'armed') return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        setGate('starting');
        ExperimentActions.Start();
      } else if (event.code === 'Escape') {
        setGate('off');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gate, ExperimentActions]);

  const handleCloseInputCollect = useCallback(
    (newSubject: string, newGroup: string, newSession: number) => {
      ExperimentActions.SetSubject(newSubject);
      ExperimentActions.SetGroup(newGroup);
      ExperimentActions.SetSession(newSession);
      setIsInputCollectOpen(false);
    },
    [ExperimentActions]
  );

  const registry = useMemo(() => resolveMarkerRegistry(params), [params]);
  const eventCallback = useCallback(
    (label: string, time: number) => {
      if (isEEGEnabled) {
        emitMarker(registry, label, time);
      }
    },
    [isEEGEnabled, registry]
  );

  const onFinish = useCallback(
    (csv: string) => ExperimentActions.Stop({ data: csv, outcome: 'complete' }),
    [ExperimentActions]
  );
  const onAbort = useCallback(
    (csv: string) =>
      ExperimentActions.Stop({ data: csv, outcome: 'incomplete' }),
    [ExperimentActions]
  );
  const handleRunAnother = useCallback(() => {
    ExperimentActions.DismissRunResult();
    setIsInputCollectOpen(true);
  }, [ExperimentActions]);

  const result = isRunning ? isEnding && 'saving' : runOutcome;

  return (
    <div className="h-full p-[3%] bg-app" data-tid="container">
      <div className="h-full">
        {result && (
          <RunResult
            outcome={result}
            modality={recordsEEG ? 'eeg' : 'behavior'}
            subject={subject}
            onClean={() => navigate(SCREENS.CLEAN.route)}
            onAnalyze={() => navigate(SCREENS.ANALYZE.route)}
            onRunAnother={handleRunAnother}
            onRunAgain={() => ExperimentActions.DismissRunResult()}
          />
        )}

        {!isRunning && !runOutcome && gate !== 'off' && (
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
              {gate === 'starting'
                ? 'Starting…'
                : 'Press Esc to go back without recording.'}
            </p>
          </div>
        )}

        {!isRunning && !runOutcome && gate === 'off' && (
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
                {(pacing || isEEGEnabled) && (
                  <ul className="m-0 list-disc space-y-1 pl-5 text-[15px]">
                    {pacing && <li>{pacing}</li>}
                    {isEEGEnabled && (
                      <li>
                        Remain still and avoid talking while trials are running.
                      </li>
                    )}
                  </ul>
                )}
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

        {isRunning && !isEnding && (
          <div className="h-full w-full">
            <ExperimentRuntime
              type={type}
              title={title}
              experimentObject={experimentObject}
              params={params}
              isEEGEnabled={isEEGEnabled}
              eventCallback={eventCallback}
              onFinish={onFinish}
              onAbort={onAbort}
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
