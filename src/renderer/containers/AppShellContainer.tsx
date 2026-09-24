import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell/AppShell';
import {
  AREA_ROUTES,
  EXPLORE_ROUTE,
  HOME_ROUTE,
  areaForPath,
} from '../components/AppShell/areas';
import { Area, Modality } from '../components/AppShell/types';
import { useWorkspaceProgress } from '../components/AppShell/useWorkspaceProgress';
import { ExperimentActions } from '../actions';
import { CONNECTION_STATUS, DEVICES } from '../constants/constants';
import { experimentLabel } from '../constants/experimentLabels';
import { RootState } from '../store';
import type { ExperimentProgress } from '../components/ExperimentRuntime';
import HeadsetSetupDialog from '../components/HeadsetSetup/HeadsetSetupDialog';

/** Lets the running experiment report trial progress to the RunBar. */
export const RunProgressContext = createContext<
  (progress: ExperimentProgress | null) => void
>(() => undefined);

/** Lets the running Collect screen receive the RunBar's "End experiment early". */
export const EndRunContext = createContext<(end: (() => void) | null) => void>(
  () => undefined
);

/** Lets the running Collect screen show the RunBar's hold-Escape status. */
export const EscapeHeldContext = createContext<(held: boolean) => void>(
  () => undefined
);

export interface HeadsetSetupApi {
  /** Opens pairing at "Which headset?" (or Connected); never starts a search. */
  openHeadsetSetup(): void;
  /** Worn headset just paired via "Check my signal"; hosts show SignalPrep until finished. */
  signalPrep: DEVICES.MUSE | DEVICES.NEUROSITY | null;
  finishSignalPrep(): void;
}

/** Lets Collect and Explore open the one shell-owned headset setup dialog. */
export const HeadsetSetupContext = createContext<HeadsetSetupApi>({
  openHeadsetSetup: () => undefined,
  signalPrep: null,
  finishSignalPrep: () => undefined,
});

const formatProgress = (progress: ExperimentProgress | null) => {
  if (!progress) return undefined;
  const count = progress.total
    ? `${progress.current} of ${progress.total}`
    : `${progress.current}`;
  return progress.phase === 'practice'
    ? `Practice trial ${count}`
    : `Trial ${count}`;
};

/** Wires Redux experiment + device state into the global AppShell chrome. */
export default function AppShellContainer({
  children,
}: {
  children?: ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const experiment = useSelector((state: RootState) => state.experiment);
  const device = useSelector((state: RootState) => state.device);

  const modality: Modality = experiment.isEEGEnabled ? 'eeg' : 'behavior';
  const workspace = experiment.title
    ? {
        name: experiment.title,
        experimentType: experimentLabel(experiment.type),
        modality,
      }
    : undefined;

  const { badges, next } = useWorkspaceProgress(
    workspace?.name,
    modality,
    pathname
  );

  const { isRunning } = experiment;
  const [setupOpen, setSetupOpen] = useState(false);
  const [signalPrep, setSignalPrep] = useState<
    DEVICES.MUSE | DEVICES.NEUROSITY | null
  >(null);
  useEffect(() => {
    if (device.connectionStatus !== CONNECTION_STATUS.CONNECTED)
      setSignalPrep(null);
  }, [device.connectionStatus]);
  /** Stable across the shell's per-second run-clock renders, so the running experiment's host does not re-render with it. */
  const headsetSetup = useMemo<HeadsetSetupApi>(
    () => ({
      openHeadsetSetup: () => setSetupOpen(true),
      signalPrep,
      finishSignalPrep: () => setSignalPrep(null),
    }),
    [signalPrep]
  );
  const [elapsed, setElapsed] = useState('00:00');
  const [progress, setProgress] = useState<ExperimentProgress | null>(null);
  const [escapeHeld, setEscapeHeld] = useState(false);
  const endRun = useRef<(() => void) | null>(null);
  const registerEndRun = useCallback((end: (() => void) | null) => {
    endRun.current = end;
  }, []);
  useEffect(() => {
    setProgress(null);
    if (!isRunning) {
      return undefined;
    }
    const start = Date.now();
    setElapsed('00:00');
    const id = setInterval(() => {
      const seconds = Math.floor((Date.now() - start) / 1000);
      setElapsed(
        `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
          seconds % 60
        ).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const deviceState =
    device.connectionStatus === CONNECTION_STATUS.CONNECTED
      ? device.deviceType === DEVICES.FIXTURE
        ? 'fixture'
        : 'connected'
      : 'none';

  return (
    <AppShell
      location={areaForPath(pathname) ?? 'home'}
      workspace={workspace}
      nextArea={next}
      badges={badges}
      device={deviceState}
      deviceName={device.connectedDevice?.name}
      run={
        isRunning
          ? { kind: modality, elapsed, progress: formatProgress(progress) }
          : undefined
      }
      onSelectArea={(area: Area) => navigate(AREA_ROUTES[area])}
      onHome={() => navigate(HOME_ROUTE)}
      onEndRun={() =>
        endRun.current
          ? endRun.current()
          : dispatch(
              ExperimentActions.Stop({ data: '', outcome: 'incomplete' })
            )
      }
      escapeHeld={escapeHeld}
      onDeviceClick={headsetSetup.openHeadsetSetup}
    >
      <RunProgressContext.Provider value={setProgress}>
        <EndRunContext.Provider value={registerEndRun}>
          <EscapeHeldContext.Provider value={setEscapeHeld}>
            <HeadsetSetupContext.Provider value={headsetSetup}>
              {children}
            </HeadsetSetupContext.Provider>
          </EscapeHeldContext.Provider>
        </EndRunContext.Provider>
      </RunProgressContext.Provider>
      <HeadsetSetupDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onDone={(d) => {
          if (d !== DEVICES.MUSE && d !== DEVICES.NEUROSITY) return;
          setSignalPrep(d);
          if (pathname !== AREA_ROUTES.collect && pathname !== EXPLORE_ROUTE)
            void navigate(EXPLORE_ROUTE);
        }}
      />
    </AppShell>
  );
}
