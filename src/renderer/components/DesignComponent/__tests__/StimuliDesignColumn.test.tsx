import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StimuliDesignColumn from '../StimuliDesignColumn';

vi.mock('../../../utils/filesystem/storage', () => ({
  readImages: vi.fn(async () => ['a.png']),
  readAudioFiles: vi.fn(async () => ['beep.mp3', 'boop.wav']),
}));

vi.mock('../../../utils/filesystem/select', () => ({
  loadFromSystemDialog: vi.fn(),
}));

describe('StimuliDesignColumn', () => {
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
});
