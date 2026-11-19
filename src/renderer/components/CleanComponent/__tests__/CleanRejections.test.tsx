import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SuggestedRejection } from '../../../actions';
import Clean, { Props as CleanProps } from '../index';

// The mocked reviewer captures the exclusion state Clean passes down and its
// toggle callbacks, so tests can click trials/sensors without a canvas.
let reviewer: {
  rejected: Set<number>;
  badChannels: Set<string>;
  onToggleEpoch(index: number): void;
  onToggleChannel(name: string): void;
};

vi.mock('../EpochReviewer', () => ({
  default: (props: typeof reviewer) => {
    reviewer = props;
    return <div data-testid="epoch-reviewer" />;
  },
}));

vi.mock('../LiveErpPane', () => ({
  default: () => <div data-testid="live-erp" />,
}));

vi.mock('lab.js', () => ({}));

const RECORDING = '/ws/Data/P1/EEG/P1-A-1-raw.csv';

vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaceRawEEGData: vi.fn(async () => [
    { name: 'P1-A-1-raw.csv', path: RECORDING },
    { name: 'P1--3-raw.csv', path: '/ws/Data/P1/EEG/P1--3-raw.csv' },
  ]),
  readWorkspaceIncompleteEEGData: vi.fn(async () => []),
  deleteIncompleteRecording: vi.fn(),
}));

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

const fakeEpochArrays = {
  buffer: new ArrayBuffer(8),
  meta: {
    n_epochs: 3,
    n_channels: 2,
    n_times: 4,
    ch_names: ['Fp1', 'Fp2'],
    times: [-0.1, 0, 0.1, 0.2],
    event_codes: [1, 2, 1],
  },
};

let props: CleanProps;

beforeEach(() => {
  props = {
    title: 'Test_Experiment',
    epochArrays: fakeEpochArrays,
    PyodideActions: {
      LoadEpochs: vi.fn(),
      CleanEpochs: vi.fn(),
      GetSuggestedRejections: vi.fn(),
    },
    ExperimentActions: {
      SetSubject: vi.fn(),
      SetGroup: vi.fn(),
      SetSession: vi.fn(),
    },
    params: null,
    suggestedRejections: [] as SuggestedRejection[],
    cleanedEpochsSave: { revision: 0, ok: false },
    navigate: vi.fn(),
  } as unknown as CleanProps;
});

const ui = (overrides: Partial<CleanProps> = {}) => (
  <MemoryRouter>
    <Clean {...props} {...overrides} />
  </MemoryRouter>
);

async function startCleaning() {
  const view = render(ui());
  fireEvent.click(await screen.findByRole('radio', { name: /P1-A-1-raw.csv/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Start cleaning' }));
  return view;
}

describe('Clean', () => {
  it('loads the one chosen recording', async () => {
    await startCleaning();

    expect(props.ExperimentActions.SetSubject).toHaveBeenCalledWith('P1');
    expect(props.ExperimentActions.SetGroup).toHaveBeenCalledWith('A');
    expect(props.ExperimentActions.SetSession).toHaveBeenCalledWith(1);
    expect(props.PyodideActions.LoadEpochs).toHaveBeenCalledWith(RECORDING);
    expect(screen.getByTestId('epoch-reviewer')).toBeInTheDocument();
  });

  it('keys the cleaned save to the chosen session even when the group is empty', async () => {
    render(ui());
    fireEvent.click(
      await screen.findByRole('radio', { name: /P1--3-raw.csv/ })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start cleaning' }));

    expect(props.ExperimentActions.SetGroup).toHaveBeenCalledWith('');
    expect(props.ExperimentActions.SetSession).toHaveBeenCalledWith(3);
  });

  it('never applies suggestions on their own; Accept and Restore do', async () => {
    const { rerender } = await startCleaning();

    rerender(
      ui({ suggestedRejections: [{ index: 2, reason: '212 µV at Fp1' }] })
    );
    expect(reviewer.rejected.size).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect([...reviewer.rejected]).toEqual([2]);

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(reviewer.rejected.size).toBe(0);
  });

  describe('re-running auto-flag', () => {
    const list = (...indices: number[]) =>
      indices.map((index) => ({ index, reason: `trial ${index} noisy` }));
    const row = (index: number) =>
      within(
        screen
          .getByRole('button', { name: `Show trial ${index}` })
          .closest('li') as HTMLElement
      );
    const summary = () => screen.getByText(/trials left out/).textContent;

    beforeEach(() => {
      props.epochArrays = {
        ...fakeEpochArrays,
        meta: {
          ...fakeEpochArrays.meta,
          n_epochs: 20,
          event_codes: Array(20).fill(1),
        },
      };
    });

    it('un-rejects accepted suggestions the new list no longer contains', async () => {
      const { rerender } = await startCleaning();
      rerender(ui({ suggestedRejections: list(1, 6, 7, 9) }));
      for (const index of [1, 6, 7]) {
        fireEvent.click(row(index).getByRole('button', { name: 'Accept' }));
      }
      expect(summary()).toBe('3 of 20 trials left out (all suggested)');

      rerender(ui({ suggestedRejections: list(1) }));

      expect([...reviewer.rejected]).toEqual([1]);
      expect(summary()).toBe('1 of 20 trials left out (all suggested)');
    });

    it("keeps the student's own rejection through any re-run and counts it as theirs", async () => {
      const { rerender } = await startCleaning();
      act(() => reviewer.onToggleEpoch(13));
      rerender(ui({ suggestedRejections: list(1, 13) }));
      fireEvent.click(row(1).getByRole('button', { name: 'Accept' }));

      expect(summary()).toBe('2 of 20 trials left out (1 by you, 1 suggested)');
      expect(row(13).getByText('✓ Left out by you')).toBeInTheDocument();
      expect(row(13).queryByRole('button', { name: 'Restore' })).toBeNull();

      rerender(ui({ suggestedRejections: list(2) }));

      expect([...reviewer.rejected]).toEqual([13]);
      expect(summary()).toBe('1 of 20 trials left out (all by you)');
    });

    it('keeps accepted suggestions when a lower threshold lists them again', async () => {
      const { rerender } = await startCleaning();
      rerender(ui({ suggestedRejections: list(1) }));
      fireEvent.click(row(1).getByRole('button', { name: 'Accept' }));

      rerender(ui({ suggestedRejections: list(1, 6, 7) }));

      expect([...reviewer.rejected]).toEqual([1]);
      expect(row(1).getByRole('button', { name: 'Restore' })).toBeEnabled();
    });

    it('says the list is out of date while the slider is off its threshold', async () => {
      const { rerender } = await startCleaning();
      fireEvent.click(
        screen.getByRole('button', { name: 'Suggest noisy trials' })
      );
      rerender(ui({ suggestedRejections: list(1) }));
      expect(screen.queryByText(/list below is for/)).toBeNull();

      fireEvent.change(screen.getByRole('slider'), {
        target: { value: '150' },
      });

      expect(
        screen.getByText(/list below is for 100 µV/).textContent
      ).toContain('press Suggest');
    });
  });

  it('new epoch arrays clear left-out trials but keep flagged sensors', async () => {
    const { rerender } = await startCleaning();
    act(() => reviewer.onToggleEpoch(1));
    act(() => reviewer.onToggleChannel('Fp1'));
    expect([...reviewer.rejected]).toEqual([1]);

    rerender(ui({ epochArrays: { ...fakeEpochArrays } }));

    expect(reviewer.rejected.size).toBe(0);
    expect([...reviewer.badChannels]).toEqual(['Fp1']);
  });

  it('Save & analyze confirms the removal, saves, then navigates once saved', async () => {
    const { rerender } = await startCleaning();
    act(() => reviewer.onToggleEpoch(0));
    act(() => reviewer.onToggleEpoch(2));

    fireEvent.click(
      screen.getByRole('button', { name: 'Save cleaned dataset & analyze' })
    );
    expect(screen.getByText('Remove the selected trials?')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove selected and analyze' })
    );

    expect(props.PyodideActions.CleanEpochs).toHaveBeenCalledWith({
      dropIndices: [0, 2],
      badChannels: [],
    });
    expect(props.navigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Suggest noisy trials' })
    ).toBeDisabled();

    rerender(ui({ cleanedEpochsSave: { revision: 1, ok: true } }));
    expect(props.navigate).toHaveBeenCalledWith('/analyze');
  });

  it('Try again after a failed save does not drop the trials a second time', async () => {
    const { rerender } = await startCleaning();
    act(() => reviewer.onToggleEpoch(1));
    act(() => reviewer.onToggleChannel('Fp1'));

    fireEvent.click(screen.getByRole('button', { name: 'Apply exclusions' }));
    expect(props.PyodideActions.CleanEpochs).toHaveBeenLastCalledWith({
      dropIndices: [1],
      badChannels: ['Fp1'],
    });

    rerender(ui({ cleanedEpochsSave: { revision: 1, ok: false } }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(props.PyodideActions.CleanEpochs).toHaveBeenLastCalledWith({
      dropIndices: [],
      badChannels: ['Fp1'],
    });
  });
});
