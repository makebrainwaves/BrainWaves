import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../constants/constants';
import { ExperimentRuntime } from '../ExperimentRuntime';

vi.mock('../LabjsExperimentWindow', () => ({
  LabjsExperimentWindow: (props: { experimentObject: unknown }) => (
    <div data-testid="labjs">{JSON.stringify(props.experimentObject)}</div>
  ),
}));

vi.mock('../ImportedExperimentWindow', () => ({
  ImportedExperimentWindow: (props: { source: string }) => (
    <div data-testid="jspsych">{props.source}</div>
  ),
}));

const readImportedExperimentFile = vi.fn();
vi.mock('../../utils/filesystem/storage', () => ({
  readImportedExperimentFile: (...args: string[]) =>
    readImportedExperimentFile(...args),
}));

const baseProps = {
  title: 'My_Study',
  eventCallback: vi.fn(),
  onFinish: vi.fn(),
};

const importedParams = (
  overrides: Record<string, unknown> = {}
): never =>
  ({
    stimuli: [],
    imported: {
      kind: 'jspsych',
      file: 'experiment/task.js',
      conditionKey: 'condition',
      correctKey: '',
      conditionLabels: ['Face'],
      ...overrides,
    },
  }) as never;

describe('ExperimentRuntime', () => {
  beforeEach(() => {
    readImportedExperimentFile.mockReset();
  });

  it('renders the lab.js runtime for a built-in experiment and reads nothing', () => {
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.N170}
        experimentObject={{ type: 'lab.flow.Sequence' }}
        params={{ stimuli: [] } as never}
      />
    );
    expect(screen.getByTestId('labjs')).toBeInTheDocument();
    expect(readImportedExperimentFile).not.toHaveBeenCalled();
  });

  it('reads the copied file and renders the jsPsych runtime for an imported timeline', async () => {
    readImportedExperimentFile.mockResolvedValue('initJsPsych({});');
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams()}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('jspsych')).toHaveTextContent('initJsPsych({});')
    );
    expect(readImportedExperimentFile).toHaveBeenCalledWith(
      'My_Study',
      'experiment/task.js'
    );
  });

  it('parses an imported lab.js study and hands it to the lab.js runtime', async () => {
    readImportedExperimentFile.mockResolvedValue('{"type":"lab.flow.Sequence"}');
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams({ kind: 'labjs', file: 'experiment/study.json' })}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('labjs')).toHaveTextContent('lab.flow.Sequence')
    );
  });

  it('shows the failure instead of a blank screen when the copy is unreadable', async () => {
    readImportedExperimentFile.mockRejectedValue(new Error('ENOENT: gone'));
    render(
      <ExperimentRuntime
        {...baseProps}
        type={EXPERIMENTS.IMPORTED}
        experimentObject={{}}
        params={importedParams()}
      />
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('ENOENT: gone')
    );
  });
});
