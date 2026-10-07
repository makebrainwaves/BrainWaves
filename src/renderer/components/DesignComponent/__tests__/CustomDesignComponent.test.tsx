import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPERIMENTS } from '../../../constants/constants';
import type { DesignProps } from '../index';
import CustomDesign from '../CustomDesignComponent';
import { params as defaultParams } from '../../../experiments/custom/params';

/**
 * Deferred-image-read infrastructure for the race test.
 *
 * StimuliDesignColumn.handleSelectFolder calls readImages once, then calls
 * onChange('dir', …), which triggers CustomDesign.handleConditionChange('dir',
 * …), which calls rebuildStimuliFromSlots → readImages a second time.
 *
 * We need the FIRST readImages to resolve (so handleSelectFolder completes and
 * the dir change propagates), and the SECOND readImages to stay pending so we
 * can change the title before the folder scan finishes computing stimuli.
 */
let resolveReadImages: ((images: string[]) => void)[] = [];
let readImagesCallCount = 0;

vi.mock('../../../utils/filesystem/storage', () => ({
  readImages: vi.fn(() => {
    const idx = readImagesCallCount++;
    return new Promise<string[]>((resolve) => {
      resolveReadImages[idx] = resolve;
    });
  }),
  readAudioFiles: vi.fn(async () => []),
}));

vi.mock('lab.js', () => ({}));

vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: vi.fn(async () => '/slow-folder'),
}));

const makeProps = (): DesignProps =>
  ({
    navigate: vi.fn(),
    type: EXPERIMENTS.CUSTOM,
    title: 'My_Custom',
    params: defaultParams,
    experimentObject: {},
    ExperimentActions: {
      SetParams: vi.fn(),
      SaveWorkspace: vi.fn(),
      SetEEGEnabled: vi.fn(),
    },
    isEEGEnabled: true,
  }) as unknown as DesignProps;

/**
 * Stand-in for the local LLM bridge: every request streams one chunk and
 * finishes, unless `holdLLM` keeps it pending.
 */
let llmHandler: ((event: unknown) => void) | undefined;
let holdLLM = false;
const generateLLM = vi.fn(({ id }: { id: string }) => {
  if (holdLLM) return;
  llmHandler?.({ type: 'chunk', id, text: 'Nice idea.' });
  llmHandler?.({ type: 'done', id });
});

async function clickStep(name: string | RegExp) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

/** Enter the Stimuli step, passing the feasibility check on the way. */
async function navigateToStimuliTab() {
  await clickStep('STIMULI');
  await clickStep(/^Continue/);
}

describe('CustomDesign condition updates', () => {
  beforeEach(() => {
    resolveReadImages = [];
    readImagesCallCount = 0;
    holdLLM = false;
    generateLLM.mockClear();
    window.electronAPI = {
      generateLLM,
      abortLLM: vi.fn(),
      onLLMEvent: (handler: (event: unknown) => void) => {
        llmHandler = handler;
        return () => {
          llmHandler = undefined;
        };
      },
    } as unknown as typeof window.electronAPI;
  });

  it('gates the stimuli step behind a finished feasibility check, once per design', async () => {
    holdLLM = true;
    render(<CustomDesign {...makeProps()} />);
    await clickStep('STIMULI');

    expect(screen.getByText('Feasibility Analysis')).toBeTruthy();
    const proceed = screen.getByRole('button', { name: /^Continue/ });
    expect(proceed).toBeDisabled();
    expect(screen.queryByText('Image Folder')).toBeNull();

    const [[{ id }]] = generateLLM.mock.calls;
    await act(async () => {
      llmHandler?.({ type: 'done', id });
    });
    await clickStep('Revise my design');
    expect(screen.queryByText('Image Folder')).toBeNull();
    await clickStep('STIMULI');
    expect(screen.getByText('Feasibility Analysis')).toBeTruthy();
    const [, [{ id: secondId }]] = generateLLM.mock.calls;
    await act(async () => {
      llmHandler?.({ type: 'done', id: secondId });
    });

    await clickStep(/^Continue/);
    expect(screen.getByText('Image Folder')).toBeTruthy();

    await clickStep('OVERVIEW');
    await clickStep('STIMULI');
    expect(screen.queryByText('Feasibility Analysis')).toBeNull();
    expect(generateLLM).toHaveBeenCalledTimes(2);
  });

  it('shows the verdict chip only while the analysis matches the design, across reopening', async () => {
    const props = makeProps();
    const { unmount } = render(<CustomDesign {...props} />);
    const chip = () =>
      screen.queryByTitle('Feasibility analysis of your current design');
    expect(chip()).toBeNull();

    await navigateToStimuliTab();
    expect(chip()?.textContent).toBe('Oh, this could get complicated');

    const [saved] = vi
      .mocked(props.ExperimentActions.SetParams)
      .mock.calls.at(-1)!;
    unmount();
    render(<CustomDesign {...props} params={saved} />);
    expect(chip()).toBeTruthy();

    await act(async () => {
      fireEvent.change(screen.getAllByRole('textbox')[1], {
        target: { value: 'Faces will produce a bigger N170 than houses.' },
      });
    });
    expect(chip()).toBeNull();
  });

  it('does not let an older folder scan overwrite a newer condition edit', async () => {
    expect.hasAssertions();
    const designProps = makeProps();
    render(<CustomDesign {...designProps} />);
    await navigateToStimuliTab();

    // Find and click the first "Select folder" button (stimulus1 slot).
    const allSelectFolderBtns = screen.getAllByRole('button', {
      name: 'Select folder',
    });
    await act(async () => {
      fireEvent.click(allSelectFolderBtns[0]);
    });

    // Call 0: StimuliDesignColumn.handleSelectFolder calls readImages.
    // Resolve it so handleSelectFolder finishes and fires onChange('dir', …).
    await act(async () => {
      resolveReadImages[0]?.(['face.png']);
    });
    // After resolution, handleSelectFolder calls setState({ numberImages: 1 })
    // then onChange('dir', '/slow-folder', 'stimulus1'), which kicks off
    // handleConditionChange('dir', …) → rebuildStimuliFromSlots → readImages
    // call 1.

    // Find the first condition title input (stimulus1 slot).
    const titleInput = screen.getAllByPlaceholderText(
      'Enter condition name'
    )[0];

    // Now change the title while the folder scan is still pending.
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Newest title' } });
    });
    // handleConditionChange('title', …) — quick, no folder scan.

    // Let the second readImages resolve (the one from rebuildStimuliFromSlots).
    await act(async () => {
      resolveReadImages[1]?.(['face.png']);
    });

    // After both updates settle, the title input should still show the newer
    // value, not whatever the old params had.
    await waitFor(() => {
      expect(titleInput).toHaveValue('Newest title');
    });
  });
});
