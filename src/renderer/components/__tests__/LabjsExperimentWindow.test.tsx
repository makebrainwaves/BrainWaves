import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LabjsExperimentWindow } from '../LabjsExperimentWindow';
import {
  instructionsScreen,
  STILLNESS_LINE,
} from '../../experiments/shared/participantScreens';
import { skipPracticeOnRequest } from '../../utils/labjs/functions';

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

  it('waits without starting a study while params is null (workspace cleared)', async () => {
    const onFinish = vi.fn();
    render(
      <LabjsExperimentWindow
        title="Study"
        experimentObject={study as never}
        params={null as never}
        eventCallback={vi.fn()}
        onFinish={onFinish}
      />
    );
    const settled = Promise.withResolvers<void>();
    setTimeout(settled.resolve, 100);
    await settled.promise;

    expect(screen.getByText('Loading Experiment')).toBeInTheDocument();
    expect(screen.queryByText('first')).not.toBeInTheDocument();
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

  it.each([
    ['q', 'skips', null],
    [' ', 'runs', 'practice trial'],
  ])(
    'pressing %j on the instruction screen %s practice',
    async (key, _, practiceText) => {
      const skipStudy = {
        type: 'lab.flow.Sequence',
        content: [
          {
            type: 'lab.html.Screen',
            content: '<p>instructions</p>',
            responses: {
              'keypress(Space)': 'continue',
              'keypress(q)': 'skipPractice',
            },
            hooks: { end: skipPracticeOnRequest },
          },
          {
            type: 'lab.flow.Loop',
            templateParameters: [{ n: 1 }],
            template: {
              type: 'lab.html.Screen',
              content: '<p>practice trial</p>',
              timeout: 10,
            },
          },
          { type: 'lab.html.Screen', content: '<p>real trials</p>' },
        ],
      };
      const seen: string[] = [];
      const observer = new MutationObserver(() =>
        seen.push(document.body.textContent ?? '')
      );
      observer.observe(document.body, { childList: true, subtree: true });
      const { unmount } = render(
        <LabjsExperimentWindow
          title="Study"
          experimentObject={skipStudy as never}
          params={{} as never}
          eventCallback={vi.fn()}
          onFinish={vi.fn()}
        />
      );
      await screen.findByText('instructions', {}, { timeout: 3000 });

      fireEvent.keyPress(document, { key: key, charCode: key.charCodeAt(0) });
      await screen.findByText('real trials', {}, { timeout: 3000 });

      observer.disconnect();
      expect(seen.some((text) => text.includes('practice trial'))).toBe(
        practiceText !== null
      );
      unmount();
    }
  );
});
