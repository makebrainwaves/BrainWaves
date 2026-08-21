import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS, DEVICES } from '../../../constants/constants';
import type { SuggestedRejection } from '../../../actions';
import Clean, { Props as CleanProps } from '../index';

// We mock the children to capture the `rejected` prop sent to EpochReviewer.
let mockRejected: Set<number> = new Set();

vi.mock('../EpochReviewer', () => ({
  default: (props: { rejected: Set<number> }) => {
    mockRejected = props.rejected;
    return <div data-testid="epoch-reviewer" />;
  },
}));

vi.mock('../CleanSidebar', () => ({
  default: () => <div data-testid="clean-sidebar" />,
}));

vi.mock('../LiveErpPane', () => ({
  default: () => <div data-testid="live-erp" />,
}));

vi.mock('lab.js', () => ({}));

vi.mock('../../../utils/filesystem/storage', () => ({
  readWorkspaceRawEEGData: vi.fn(async () => [
    { name: 'session_1.fif', path: '/sub-01/session_1.fif' },
  ]),
}));

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

const baseProps: Record<string, unknown> = {
  type: EXPERIMENTS.N170,
  title: 'Test_Experiment',
  deviceType: DEVICES.MUSE,
  epochsInfo: [{ name: 'N170', value: 100 }],
  epochArrays: fakeEpochArrays,
  PyodideActions: { LoadEpochs: vi.fn() },
  ExperimentActions: { SetSubject: vi.fn() },
  subject: '',
  session: 0,
  params: null,
  suggestedRejections: [] as SuggestedRejection[],
};

describe('Clean suggestedRejections merge', () => {
  beforeEach(() => {
    mockRejected = new Set();
  });

  it('merges suggestedRejections indices into rejectedEpochs', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <Clean {...(baseProps as unknown as CleanProps)} />
      </MemoryRouter>
    );

    // The mount effect reads workspace data and sets subjects/file paths.
    // After that, the user selects a file and loads the dataset.
    // The file-path multi-select fires onChange via handleRecordingChange.
    // Wait for the mount effect to populate the select options.

    await waitFor(() => {
      expect(screen.getByText('Load Dataset →')).toBeInTheDocument();
    });

    // Select the first (and only) file path.
    const select = screen.getByRole('listbox') as HTMLSelectElement;
    const option = screen.getByRole('option', {
      name: 'session_1.fif',
    }) as HTMLOptionElement;
    option.selected = true;
    await act(async () => {
      fireEvent.change(select);
    });

    // Click "Load Dataset" to switch to review view.
    await act(async () => {
      fireEvent.click(screen.getByText('Load Dataset →'));
    });

    // Now EpochReviewer should be rendered.
    expect(screen.getByTestId('epoch-reviewer')).toBeInTheDocument();

    // Rerender with suggestedRejections.
    const suggestions: SuggestedRejection[] = [
      { index: 2, reason: 'High peak-to-peak' },
      { index: 5, reason: 'Muscle artifact' },
    ];
    rerender(
      <MemoryRouter>
        <Clean
          {...(baseProps as unknown as CleanProps)}
          suggestedRejections={suggestions}
        />
      </MemoryRouter>
    );

    // The componentDidUpdate in the class (and later the useEffect in the
    // function component) merges the new indices into rejectedEpochs.
    expect(mockRejected.has(2)).toBe(true);
    expect(mockRejected.has(5)).toBe(true);
    // The set should not contain an index that was never suggested (1).
    expect(mockRejected.size).toBe(2);
  });
});
