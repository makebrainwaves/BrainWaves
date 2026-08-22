import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import Home, { Props } from '../index';

const loadFromSystemDialog = vi.fn();
vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: () => loadFromSystemDialog(),
}));

const importExperimentFile = vi.fn();
vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaces: vi.fn(async () => []),
  readAndParseState: vi.fn(async () => null),
  openWorkspaceDir: vi.fn(),
  deleteWorkspaceDir: vi.fn(),
  importExperimentFile: (...args: string[]) => importExperimentFile(...args),
}));

const readFiles = vi.fn();
vi.mock('../../../utils/filesystem/read', () => ({
  readFiles: (...args: unknown[]) => readFiles(...args),
}));

const toastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), { error: (message: string) => toastError(message) }),
}));

vi.mock('lab.js', () => ({}));

const makeProps = (): Props =>
  ({
    availableDevices: [],
    availableLSLStreams: [],
    connectedDevice: null,
    DeviceActions: {},
    ExperimentActions: { CreateNewWorkspace: vi.fn() },
    navigate: vi.fn(),
    PyodideActions: { Launch: vi.fn() },
    activeStep: 'EXPERIMENT BANK',
  }) as unknown as Props;

describe('Home — import experiment', () => {
  beforeEach(() => {
    loadFromSystemDialog.mockReset();
    importExperimentFile.mockReset();
    readFiles.mockReset();
    toastError.mockReset();
  });

  it('relabels the Custom card as Experiment Builder', () => {
    render(<Home {...makeProps()} />);
    expect(screen.getByText('Experiment Builder')).toBeInTheDocument();
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
  });

  it('creates an imported workspace from a v8 timeline', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/faces_task.js');
    readFiles.mockResolvedValue([
      "const t = { type: jsPsychImageKeyboardResponse, data: { condition: 'Face' } };",
    ]);
    importExperimentFile.mockResolvedValue({ file: 'experiment/faces_task.js' });

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(props.ExperimentActions.CreateNewWorkspace).toHaveBeenCalledWith({
        title: 'faces_task',
        type: EXPERIMENTS.IMPORTED,
        imported: {
          kind: 'jspsych',
          file: 'experiment/faces_task.js',
          conditionKey: '',
          correctKey: '',
          conditionLabels: [],
        },
      })
    );
    expect(props.navigate).toHaveBeenCalledWith('/design');
  });

  it('rejects a jsPsych v6 file before copying anything', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/old_task.js');
    readFiles.mockResolvedValue(['jsPsych.init({ timeline: [] });']);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('jsPsych.init')
      )
    );
    expect(importExperimentFile).not.toHaveBeenCalled();
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });

  it('names a missing plugin instead of letting it die mid-run', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/survey_task.js');
    readFiles.mockResolvedValue(['const t = { type: jsPsychNotARealPlugin };']);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('jsPsychNotARealPlugin')
      )
    );
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });

  it('imports a lab.js study without scanning it as jsPsych', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Desktop/my_study.json');
    importExperimentFile.mockResolvedValue({ file: 'experiment/my_study.json' });

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() =>
      expect(props.ExperimentActions.CreateNewWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          imported: expect.objectContaining({ kind: 'labjs' }),
        })
      )
    );
    expect(readFiles).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is cancelled', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue(null);

    render(<Home {...props} />);
    fireEvent.click(screen.getByText('Import Experiment'));

    await waitFor(() => expect(loadFromSystemDialog).toHaveBeenCalled());
    expect(props.ExperimentActions.CreateNewWorkspace).not.toHaveBeenCalled();
  });
});
