import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildJsPsychOptions,
  createJsPsychHost,
  resolveTrialData,
} from '../host';
import { buildMarkerRegistryFromLabels } from '../../eeg/markerRegistry';

const registry = buildMarkerRegistryFromLabels(['Face', 'House']);
const mapping = { conditionKey: 'condition', correctKey: '' };

const fakeInstance = (data: Record<string, unknown>) => ({
  timeline: { getLatestNode: () => ({ getDataParameter: () => data }) },
});

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

describe('resolveTrialData', () => {
  it('prefers the running Trial node, because trialObject.data is unresolved', () => {
    // jsPsych keeps `trialObject` as deepCopy(description): a
    // `jsPsych.timelineVariable('cond')` in `data` is still a TimelineVariable
    // OBJECT at on_trial_start. getDataParameter() is the resolver.
    expect(
      resolveTrialData(fakeInstance({ condition: 'House' }), {
        data: { condition: { placeholder: true } },
      })
    ).toEqual({ condition: 'House' });
  });

  it('falls back to the raw trial data when no node is reachable', () => {
    expect(resolveTrialData({}, { data: { condition: 'Face' } })).toEqual({
      condition: 'Face',
    });
  });

  it('returns an empty object when there is no data at all', () => {
    expect(resolveTrialData({}, {})).toEqual({});
    expect(resolveTrialData(undefined, undefined)).toEqual({});
  });
});

describe('buildJsPsychOptions', () => {
  const build = (
    authorOptions: Record<string, unknown> = {},
    resolved: Record<string, unknown> = { condition: 'House' }
  ) => {
    const eventCallback = vi.fn();
    const onFinish = vi.fn();
    const options = buildJsPsychOptions({
      hostElementId: 'host',
      mapping,
      registry,
      eventCallback,
      onFinish,
      getInstance: () => fakeInstance(resolved),
      authorOptions,
    });
    return { options, eventCallback, onFinish };
  };

  it('forces the display element and override_safe_mode', () => {
    const { options } = build({ display_element: 'author-div' });
    expect(options.display_element).toBe('host');
    // Without this, prod (file://) silently disables WebAudio.
    expect(options.override_safe_mode).toBe(true);
  });

  it('preserves author options it does not own', () => {
    const { options } = build({ show_progress_bar: true, default_iti: 250 });
    expect(options.show_progress_bar).toBe(true);
    expect(options.default_iti).toBe(250);
  });

  it('emits the declared code for the resolved condition on the next frame', async () => {
    const { options, eventCallback } = build();
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    expect(eventCallback).not.toHaveBeenCalled();
    await nextFrame();
    expect(eventCallback).toHaveBeenCalledTimes(1);
    expect(eventCallback.mock.calls[0][0]).toBe(2); // House
  });

  it('emits nothing for a trial whose condition was never declared', async () => {
    const { options, eventCallback } = build({}, { condition: 'Scene' });
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(eventCallback).not.toHaveBeenCalled();
  });

  it('shouts when the condition key resolves to a non-string', async () => {
    // The single worst failure mode in the feature: an unresolved
    // TimelineVariable means no marker, a perfect-looking behavioral CSV, and an
    // EEG Marker column of zeros discovered only at analysis. It must be loud.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { options, eventCallback } = build({}, { condition: { unresolved: true } });
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(eventCallback).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("condition key 'condition' resolved to a object")
    );
    error.mockRestore();
  });

  it('stays silent when the trial simply has no condition key at all', async () => {
    // Not every trial is a stimulus trial. Instructions and fixation screens
    // legitimately carry no condition, and warning on those would train the
    // teacher to ignore the console.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { options } = build({}, {});
    (options.on_trial_start as (t: unknown) => void)({ data: {} });
    await nextFrame();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('chains the author on_trial_start rather than clobbering it', () => {
    const authorOnTrialStart = vi.fn();
    const { options } = build({ on_trial_start: authorOnTrialStart });
    const trialObject = { data: {} };
    (options.on_trial_start as (t: unknown) => void)(trialObject);
    expect(authorOnTrialStart).toHaveBeenCalledWith(trialObject);
  });

  it('chains the author on_finish and hands BrainWaves a behavioral CSV', () => {
    const authorOnFinish = vi.fn();
    const { options, onFinish } = build({ on_finish: authorOnFinish });
    const data = {
      values: () => [
        { trial_index: 0, rt: 480, condition: 'Face', trial_type: 'x' },
      ],
    };
    (options.on_finish as (d: unknown) => void)(data);
    expect(authorOnFinish).toHaveBeenCalledWith(data);
    const csv = onFinish.mock.calls[0][0] as string;
    const lines = csv.replace(/\r/g, '').split('\n');
    expect(lines[0]).toBe(
      'trial_number,condition,reaction_time,response_given,correct_response,phase,trial_type,time_elapsed'
    );
    expect(lines[1]).toBe('1,Face,480,yes,true,test,x,');
  });
});

describe('createJsPsychHost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('runs a real timeline end to end and reports the CSV', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    let csv = '';
    let host: { teardown: () => void } | undefined;
    const finished = new Promise<void>((resolve) => {
      host = createJsPsychHost(
        `
        const jsPsych = initJsPsych({});
        jsPsych.run([
          { type: jsPsychCallFunction, func: () => {}, data: { condition: 'Face' } },
          { type: jsPsychCallFunction, func: () => {}, data: { condition: 'House' } },
        ]);
        `,
        {
          hostElementId: 'host',
          mapping,
          registry,
          eventCallback: vi.fn(),
          onFinish: (value) => {
            csv = value;
            resolve();
          },
        }
      );
    });
    await finished;
    host!.teardown();

    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('1,Face,');
    expect(csv).toContain('2,House,');
    // Globals are restored, so previewing then running never redeclares.
    expect(
      (window as unknown as Record<string, unknown>).jsPsychCallFunction
    ).toBeUndefined();
  });

  it('re-declaring the same top-level names twice does not throw', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const config = {
      hostElementId: 'host',
      mapping,
      registry,
      eventCallback: vi.fn(),
      onFinish: vi.fn(),
    };
    const source = 'const jsPsych = initJsPsych({});';
    createJsPsychHost(source, config).teardown();
    expect(() => createJsPsychHost(source, config).teardown()).not.toThrow();
  });

  it('throws with the author error message when the file is broken', () => {
    document.body.innerHTML = '<div id="host"></div>';
    expect(() =>
      createJsPsychHost('thisIsNotDefined();', {
        hostElementId: 'host',
        mapping,
        registry,
        eventCallback: vi.fn(),
        onFinish: vi.fn(),
      })
    ).toThrow(/createJsPsychHost: .*thisIsNotDefined/);
  });
});
