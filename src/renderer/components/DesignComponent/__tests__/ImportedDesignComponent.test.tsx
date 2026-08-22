import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import type { DesignProps } from '../index';
import ImportedDesign from '../ImportedDesignComponent';

const readImportedExperimentFile = vi.fn();
vi.mock('../../../utils/filesystem/storage', () => ({
  readImportedExperimentFile: (...args: string[]) =>
    readImportedExperimentFile(...args),
}));

const loadFromSystemDialog = vi.fn();
vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: () => loadFromSystemDialog(),
}));

vi.mock('lab.js', () => ({}));
vi.mock('../../PreviewExperimentComponent', () => ({
  default: () => <div data-testid="preview" />,
}));

const imported = {
  kind: 'jspsych' as const,
  file: 'experiment/task.js',
  conditionKey: '',
  correctKey: '',
  conditionLabels: [],
};

const makeProps = (overrides: Partial<DesignProps> = {}): DesignProps =>
  ({
    navigate: vi.fn(),
    type: EXPERIMENTS.IMPORTED,
    title: 'faces_task',
    params: { stimuli: [], imported },
    experimentObject: {},
    isEEGEnabled: true,
    ExperimentActions: {
      SetParams: vi.fn(),
      SaveWorkspace: vi.fn(),
      SetEEGEnabled: vi.fn(),
    },
    ...overrides,
  }) as unknown as DesignProps;

const goToMarkers = async () => {
  await waitFor(() => expect(readImportedExperimentFile).toHaveBeenCalled());
  fireEvent.click(screen.getByText('MARKERS'));
  await waitFor(() => expect(screen.getByLabelText('Condition key')).toBeInTheDocument());
};

const chooseConditionKey = (key: string) =>
  fireEvent.change(screen.getByLabelText('Condition key'), {
    target: { value: key },
  });

describe('ImportedDesign — Markers tab', () => {
  beforeEach(() => {
    readImportedExperimentFile.mockReset();
    readImportedExperimentFile.mockResolvedValue(
      `const a = { data: { condition: 'Face', correct: true } };
       const b = { data: { condition: 'House' } };`
    );
    loadFromSystemDialog.mockReset();
  });

  it('offers every data key the scan found as the condition key', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();

    expect(
      [...screen.getByLabelText('Condition key').querySelectorAll('option')].map(
        (option) => option.textContent
      )
    ).toEqual(['Choose a key', 'condition', 'correct']);
  });

  it('pre-populates the label order from the scanned values and shows the codes', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();
    chooseConditionKey('condition');

    expect(screen.getByTestId('code-Face')).toHaveTextContent('1');
    expect(screen.getByTestId('code-House')).toHaveTextContent('2');
  });

  it('persists the frozen contract when the teacher confirms', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.change(screen.getByLabelText('Correctness key'), {
      target: { value: 'correct' },
    });
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: {
          ...imported,
          conditionKey: 'condition',
          correctKey: 'correct',
          conditionLabels: ['Face', 'House'],
        },
      })
    );
    expect(props.ExperimentActions.SaveWorkspace).toHaveBeenCalled();
  });

  it('adds a label the scan could not see on a dynamic branch', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.change(screen.getByLabelText('Add a label the scan missed'), {
      target: { value: 'Scene' },
    });
    fireEvent.click(screen.getByText('Add label'));
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: expect.objectContaining({
          conditionLabels: ['Face', 'House', 'Scene'],
        }),
      })
    );
  });

  it('reorders labels and renumbers the codes to match', async () => {
    render(<ImportedDesign {...makeProps()} />);
    await goToMarkers();
    chooseConditionKey('condition');
    fireEvent.click(screen.getByLabelText('Move House up'));

    expect(screen.getByTestId('code-House')).toHaveTextContent('1');
    expect(screen.getByTestId('code-Face')).toHaveTextContent('2');
  });

  it('forces EEG off and says so when no conditions are declared', async () => {
    const props = makeProps();
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    expect(props.ExperimentActions.SetEEGEnabled).toHaveBeenCalledWith(false);
    expect(
      screen.getByText(/records responses but no brain data/i)
    ).toBeInTheDocument();
  });

  it('does not keep re-dispatching SetEEGEnabled once EEG is already off', async () => {
    const props = makeProps({ isEEGEnabled: false });
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    expect(props.ExperimentActions.SetEEGEnabled).not.toHaveBeenCalled();
  });

  it('authorizes an asset folder for relative stimulus URLs', async () => {
    const props = makeProps();
    loadFromSystemDialog.mockResolvedValue('/Users/t/Documents/faces');
    render(<ImportedDesign {...props} />);
    await goToMarkers();

    fireEvent.click(screen.getByText('Select asset folder'));
    await waitFor(() =>
      expect(screen.getByText('/Users/t/Documents/faces')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Freeze marker codes'));

    expect(props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        imported: expect.objectContaining({
          assetDir: '/Users/t/Documents/faces',
        }),
      })
    );
  });
});
