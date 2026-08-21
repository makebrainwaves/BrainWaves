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
import type { RootState } from '../../reducers';
import { saveWorkspaceEpic } from '../experimentEpics';
import { storeExperimentState } from '../../utils/filesystem/storage';

vi.mock('../../utils/filesystem/storage', () => ({
  createEEGWriteStream: vi.fn(),
  writeHeader: vi.fn(),
  writeEEGData: vi.fn(),
  writeEEGEvents: vi.fn(),
  storeExperimentState: vi.fn().mockResolvedValue(undefined),
  restoreExperimentState: vi.fn(),
  createWorkspaceDir: vi.fn(),
  storeBehavioralData: vi.fn(),
  readWorkspaceBehaviorData: vi.fn(),
  getWorkspaceDir: vi.fn(),
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
    } as unknown as import('redux-observable').StateObservable<RootState>;

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
