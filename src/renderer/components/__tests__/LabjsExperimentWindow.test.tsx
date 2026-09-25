import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LabjsExperimentWindow } from '../LabjsExperimentWindow';
import {
  instructionsScreen,
  STILLNESS_LINE,
} from '../../experiments/shared/participantScreens';

// lab.js needs browser APIs jsdom lacks: its canvas module subclasses
// DOMMatrixReadOnly at import, every controller opens an AudioContext, and
// flips read document.timeline for their timestamps. vi.hoisted runs before
// the imports above.
vi.hoisted(() => {
  Object.assign(window, {
    DOMMatrixReadOnly: class {},
    AudioContext: class {
      close = () => Promise.resolve();
    },
  });
  Object.defineProperty(document, 'timeline', {
    get: () => ({ currentTime: performance.now() }),
  });
});

const study = {
  type: 'lab.flow.Sequence',
  content: [
    { type: 'lab.html.Screen', content: '<p>first</p>', timeout: 10 },
    { type: 'lab.html.Screen', content: '<p>waiting</p>' },
  ],
};

const instructionsStudy = {
  type: 'lab.flow.Sequence',
  content: [
    {
      type: 'lab.html.Screen',
      content: instructionsScreen({
        title: 'Faces and houses',
        summary: 'summary',
        rules: [{ keys: [{ key: '1', meaning: 'Face' }] }],
      }),
    },
  ],
};

describe('LabjsExperimentWindow', () => {
  it('unmounting mid-study reports the trials so far at once, and never onFinish', async () => {
    const onFinish = vi.fn();
    const onAbort = vi.fn();
    const { unmount } = render(
      <LabjsExperimentWindow
        title="Study"
        experimentObject={study as never}
        params={{} as never}
        eventCallback={vi.fn()}
        onFinish={onFinish}
        onAbort={onAbort}
      />
    );
    await screen.findByText('waiting', {}, { timeout: 3000 });

    unmount();

    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(onAbort.mock.calls[0][0]).toContain('html.Screen');
    expect(onFinish).not.toHaveBeenCalled();
  });

  it.each([
    [true, true],
    [false, false],
  ])('EEG %s → stillness line shown: %s', async (isEEGEnabled, shown) => {
    const { unmount } = render(
      <LabjsExperimentWindow
        title="Study"
        experimentObject={instructionsStudy as never}
        params={{} as never}
        isEEGEnabled={isEEGEnabled}
        eventCallback={vi.fn()}
        onFinish={vi.fn()}
      />
    );
    await screen.findByText('Faces and houses', {}, { timeout: 3000 });

    expect(Boolean(screen.queryByText(STILLNESS_LINE))).toBe(shown);
    unmount();
  });
});
