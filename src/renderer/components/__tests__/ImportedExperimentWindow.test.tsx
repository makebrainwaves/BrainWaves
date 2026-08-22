import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportedExperimentWindow } from '../ImportedExperimentWindow';

const teardown = vi.fn();
const createJsPsychHost = vi.fn((_source: string, _config: unknown) => ({
  teardown,
}));
vi.mock('../../utils/jspsych/host', () => ({
  createJsPsychHost: (source: string, config: unknown) =>
    createJsPsychHost(source, config),
}));
vi.mock('jspsych/css/jspsych.css', () => ({}));

const imported = {
  kind: 'jspsych' as const,
  file: 'experiment/task.js',
  conditionKey: 'condition',
  correctKey: 'correct',
  conditionLabels: ['Face', 'House'],
};

const baseProps = {
  title: 'My_Study',
  source: "const jsPsych = initJsPsych({}); const s = 'stimuli/face1.png';",
  eventCallback: vi.fn(),
  onFinish: vi.fn(),
};

describe('ImportedExperimentWindow', () => {
  beforeEach(() => {
    createJsPsychHost.mockReset();
    createJsPsychHost.mockReturnValue({ teardown });
    teardown.mockReset();
  });

  it('hosts the timeline in a div that exists before the host is created', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    const [, config] = createJsPsychHost.mock.calls[0] as unknown as [
      string,
      { hostElementId: string },
    ];
    expect(document.getElementById(config.hostElementId)).toBeInTheDocument();
  });

  it('passes the declared registry and mapping through', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    const [, config] = createJsPsychHost.mock.calls[0] as unknown as [
      string,
      { registry: { eventId: Record<string, number> }; mapping: unknown },
    ];
    expect(config.registry.eventId).toEqual({ Face: 1, House: 2 });
    expect(config.mapping).toEqual({
      conditionKey: 'condition',
      correctKey: 'correct',
    });
  });

  it('leaves the source alone when no asset folder is authorized', () => {
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    expect(createJsPsychHost.mock.calls[0][0]).toBe(baseProps.source);
  });

  it('rewrites relative asset URLs when an asset folder is authorized', () => {
    render(
      <ImportedExperimentWindow
        {...baseProps}
        imported={{ ...imported, assetDir: '/Users/teacher/faces' }}
      />
    );
    expect(createJsPsychHost.mock.calls[0][0]).toContain('bwfile://');
  });

  it('tears the host down on unmount', () => {
    const { unmount } = render(
      <ImportedExperimentWindow {...baseProps} imported={imported} />
    );
    unmount();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('shows the author error instead of a blank screen', async () => {
    createJsPsychHost.mockImplementation(() => {
      throw new Error('createJsPsychHost: boom');
    });
    render(<ImportedExperimentWindow {...baseProps} imported={imported} />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'createJsPsychHost: boom'
      )
    );
  });
});
