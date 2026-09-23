import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell/AppShell';
import {
  AREA_ROUTES,
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

/** Lets the running experiment report trial progress to the RunBar. */
export const RunProgressContext = createContext<
  (progress: ExperimentProgress | null) => void
>(() => undefined);

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
  const [elapsed, setElapsed] = useState('00:00');
  const [progress, setProgress] = useState<ExperimentProgress | null>(null);
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
      onEndRun={() => dispatch(ExperimentActions.Stop({ data: '' }))}
    >
      <RunProgressContext.Provider value={setProgress}>
        {children}
      </RunProgressContext.Provider>
    </AppShell>
  );
}
