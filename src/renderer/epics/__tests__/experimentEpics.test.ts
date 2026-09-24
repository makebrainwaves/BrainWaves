import { of, Subject } from 'rxjs';
import { describe, it, afterEach, expect, vi } from 'vitest';
import { ExperimentActions } from '../../actions';
import type { ExperimentActionType } from '../../actions';
import {
  EXPERIMENTS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import type { StateObservable } from 'redux-observable';
import type { RootState } from '../../reducers';
import type { EEGData } from '../../constants/interfaces';
import experimentEpics, { saveWorkspaceEpic } from '../experimentEpics';
import {
  markRecordingIncomplete,
  storeBehavioralData,
  storeExperimentState,
} from '../../utils/filesystem/storage';
import {
  closeEEGStream,
  createEEGWriteStream,
  writeEEGData,
} from '../../utils/filesystem/write';

vi.mock('../../utils/filesystem/storage', () => ({
  createEEGWriteStream: vi.fn(),
  writeHeader: vi.fn(),
  writeEEGData: vi.fn(),
  writeEEGEvents: vi.fn(),
  storeExperimentState: vi.fn().mockResolvedValue(undefined),
  restoreExperimentState: vi.fn(),
  createWorkspaceDir: vi.fn(),
  storeBehavioralData: vi.fn().mockResolvedValue(undefined),
  markRecordingIncomplete: vi.fn().mockResolvedValue(undefined),
  getWorkspaceDir: vi.fn(),
}));
vi.mock('../../utils/filesystem/write', () => ({
  createEEGWriteStream: vi.fn(),
  writeHeader: vi.fn(),
  writeEEGData: vi.fn(),
  writeEEGEvents: vi.fn().mockResolvedValue(undefined),
  closeEEGStream: vi.fn(),
}));
vi.mock('../../utils/eeg/markerRegistry', () => ({
  resolveMarkerRegistry: () => ({ codeToLabel: {} }),
}));

const experiment = {
  type: EXPERIMENTS.CUSTOM,
  title: 'My_Custom',
  params: {
    trialDuration: 1000,
    intro: '',
    iti: 500,
    nbTrials: 0,
    sampleType: 'with-replacement',
    showProgressBar: false,
  },
  experimentObject: { type: 'lab.flow.Sequence' },
  subject: '',
  group: '',
  session: 1,
  isRunning: false,
  isEEGEnabled: true,
  dateModified: null,
};
const rootState = (title: string): RootState =>
  ({
    experiment: { ...experiment, title },
    device: {
      availableDevices: [],
      availableLSLStreams: [],
      connectedDevice: { name: 'disconnected', samplingRate: 0, channels: [] },
      connectionStatus: CONNECTION_STATUS.NOT_YET_CONNECTED,
      deviceAvailability: DEVICE_AVAILABILITY.NONE,
      rawObservable: null,
      signalQualityObservable: null,
      deviceType: DEVICES.MUSE,
    },
    pyodide: {
      epochsInfo: [],
      channelInfo: [],
      psdPlot: null,
      topoPlot: null,
      erpPlot: null,
      epochArrays: null,
      suggestedRejections: [],
      worker: null,
      isWorkerReady: false,
      cleanedEpochsSave: { revision: 0, ok: false },
    },
  }) as RootState;

describe('saveWorkspaceEpic', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('persists the state captured when save was requested even after cleanup', async () => {
    vi.useFakeTimers();
    const actions = new Subject<ExperimentActionType>();
    const state = {
      value: rootState('My_Custom'),
      subscribe: vi.fn(),
      lift: vi.fn(),
    } as unknown as StateObservable<RootState>;

    const output = saveWorkspaceEpic(actions, state, undefined).subscribe();

    actions.next(ExperimentActions.SaveWorkspace());
    state.value = rootState('');
    await vi.advanceTimersByTimeAsync(400);

    expect(storeExperimentState).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My_Custom' })
    );
    output.unsubscribe();
  });
});

type Mutable = {
  experiment: Record<string, unknown>;
  device: Record<string, unknown>;
};

const recording = (raw?: Subject<EEGData>) => {
  const s = rootState('My_Custom') as unknown as Mutable;
  s.experiment.subject = 'P1';
  s.experiment.group = 'A';
  if (raw) {
    s.device.connectionStatus = CONNECTION_STATUS.CONNECTED;
    s.device.rawObservable = raw;
    s.device.connectedDevice = {
      name: 'Fixture',
      samplingRate: 256,
      channels: ['AF7'],
    };
  }
  return s;
};

const runThenStop = async (
  s: Mutable,
  outcome: 'complete' | 'incomplete',
  afterStop?: () => void
) => {
  const actions = new Subject<ExperimentActionType>();
  const state = { value: s } as unknown as StateObservable<RootState>;
  const out: ExperimentActionType[] = [];
  const sub = experimentEpics(actions, state, undefined).subscribe((a) =>
    out.push(a)
  );
  actions.next(ExperimentActions.Start());
  await vi.waitFor(() =>
    expect(out).toContainEqual(ExperimentActions.SetIsRunning(true))
  );
  s.experiment.isRunning = true;
  actions.next(ExperimentActions.Stop({ data: 'csv', outcome }));
  afterStop?.();
  await vi.waitFor(() =>
    expect(out).toContainEqual(ExperimentActions.SetIsRunning(false))
  );
  sub.unsubscribe();
};

describe('experiment stop', () => {
  afterEach(() => vi.clearAllMocks());

  it('closes the EEG file, then saves behavior, then marks an ended-early run incomplete', async () => {
    const calls: string[] = [];
    vi.mocked(createEEGWriteStream).mockResolvedValue('stream-1');
    vi.mocked(closeEEGStream).mockImplementation(async (id) => {
      calls.push(`close:${id}`);
    });
    vi.mocked(storeBehavioralData).mockImplementation(async () => {
      calls.push('behavior');
    });
    vi.mocked(markRecordingIncomplete).mockImplementation(async () => {
      calls.push('incomplete');
    });
    const raw = new Subject<EEGData>();

    await runThenStop(recording(raw), 'incomplete', () =>
      raw.next({ timestamp: 1, data: [1] } as EEGData)
    );

    expect(calls).toEqual(['close:stream-1', 'behavior', 'incomplete']);
    expect(writeEEGData).not.toHaveBeenCalled();
  });

  it('never marks a completed run', async () => {
    await runThenStop(recording(), 'complete');

    expect(storeBehavioralData).toHaveBeenCalledWith(
      'csv',
      'My_Custom',
      'P1',
      'A',
      1
    );
    expect(markRecordingIncomplete).not.toHaveBeenCalled();
  });

  it('still hides an ended-early run when saving behavior fails', async () => {
    vi.mocked(storeBehavioralData).mockRejectedValueOnce(new Error('EACCES'));

    await runThenStop(recording(), 'incomplete');

    expect(markRecordingIncomplete).toHaveBeenCalledWith(
      'My_Custom',
      'P1',
      'A',
      1
    );
  });
});
