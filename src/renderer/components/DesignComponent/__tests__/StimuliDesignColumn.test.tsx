import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StimuliDesignColumn from '../StimuliDesignColumn';

// vi.mock factory is hoisted to top of file; use vi.hoisted to create a
// reference that survives the hoisting.
const { mockReadAudioFiles } = vi.hoisted(() => {
  const fn = vi.fn(async (_dir: string) => ['beep.mp3', 'boop.wav']);
  return { mockReadAudioFiles: fn };
});

vi.mock('../../../utils/filesystem/storage', () => ({
  readImages: vi.fn(async () => ['a.png']),
  readAudioFiles: mockReadAudioFiles,
}));

vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: vi.fn(),
}));

describe('StimuliDesignColumn', () => {
  beforeEach(() => {
    mockReadAudioFiles.mockReset();
    mockReadAudioFiles.mockImplementation(async (_dir: string) => ['beep.mp3', 'boop.wav']);
  });

  it('re-derives the sound count from the folder on mount', async () => {
    render(
      <table>
        <tbody>
          <StimuliDesignColumn
            num={1}
            title="Face"
            response="1"
            dir="/faces"
            audioDir="/tones"
            numberImages={2}
            onChange={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(await screen.findByText('( 2 sounds )')).toBeTruthy();
  });

  it('updates the sound count when audioDir changes', async () => {
    const { rerender } = render(
      <table>
        <tbody>
          <StimuliDesignColumn
            num={1}
            title="Face"
            response="1"
            dir="/faces"
            audioDir="/tones"
            numberImages={2}
            onChange={vi.fn()}
          />
        </tbody>
      </table>
    );

    // Wait for the initial mount effect to complete and render the label.
    expect(await screen.findByText('( 2 sounds )')).toBeTruthy();
    expect(mockReadAudioFiles).toHaveBeenCalledTimes(1);

    // Return a different count for the next call.
    mockReadAudioFiles.mockImplementation(async (dir: string) => {
      if (dir === '/new-tones') return ['a.wav', 'b.mp3', 'c.mp3'];
      return ['beep.mp3', 'boop.wav'];
    });

    // Rerender with a different audioDir. The componentDidUpdate / useEffect
    // will call refreshSoundCount, which reads the new folder.
    await act(async () => {
      rerender(
        <table>
          <tbody>
            <StimuliDesignColumn
              num={1}
              title="Face"
              response="1"
              dir="/faces"
              audioDir="/new-tones"
              numberImages={2}
              onChange={vi.fn()}
            />
          </tbody>
        </table>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('( 3 sounds )')).toBeTruthy();
    });
  });
});