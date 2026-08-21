import { describe, expect, it, vi } from 'vitest';

vi.mock('lab.js', () => ({}));
import { EVENTS, EXPERIMENTS } from '../../../constants/constants';
import type { DesignProps } from '../index';
import CustomDesign from '../CustomDesignComponent';
import { params } from '../../../experiments/custom/params';

let finishRead: ((images: string[]) => void) | undefined;

vi.mock('../../../utils/filesystem/storage', () => ({
  readImages: vi.fn(
    () =>
      new Promise<string[]>((resolve) => {
        finishRead = resolve;
      })
  ),
  readAudioFiles: vi.fn(async () => []),
}));

const makeProps = (overrideParams = params): DesignProps =>
  ({
    navigate: vi.fn(),
    type: EXPERIMENTS.CUSTOM,
    title: 'My_Custom',
    params: overrideParams,
    experimentObject: {},
    ExperimentActions: {
      SetParams: vi.fn(),
      SaveWorkspace: vi.fn(),
      SetEEGEnabled: vi.fn(),
    },
    isEEGEnabled: true,
  }) as unknown as DesignProps;

describe('CustomDesign condition updates', () => {
  it('does not let an older folder scan overwrite a newer condition edit', async () => {
    const design = new CustomDesign(makeProps());
    design.setState = ((update) => {
      const patch =
        typeof update === 'function'
          ? update(design.state, design.props)
          : update;
      design.state = { ...design.state, ...patch };
    }) as typeof design.setState;

    const folderUpdate = design.handleConditionChange(
      'dir',
      '/slow-folder',
      'stimulus1'
    );
    await design.handleConditionChange('title', 'Newest title', 'stimulus1');
    finishRead?.(['face.png']);
    await folderUpdate;

    expect(design.state.params.stimulus1?.title).toBe('Newest title');
  });

  it('saves intro and taskHelp from current React state', () => {
    const design = new CustomDesign(makeProps());
    design.setState = ((update) => {
      const patch =
        typeof update === 'function'
          ? update(design.state, design.props)
          : update;
      design.state = { ...design.state, ...patch };
    }) as typeof design.setState;

    design.setState({
      params: {
        ...design.state.params,
        intro: 'Welcome to the study',
        taskHelp: 'Press 1 or 9',
      },
    });

    design.handleSaveParams();

    expect(design.props.ExperimentActions.SetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        intro: 'Welcome to the study',
        taskHelp: 'Press 1 or 9',
      })
    );
    expect(design.state.params.intro).toBe('Welcome to the study');
    expect(design.state.params.taskHelp).toBe('Press 1 or 9');
  });

  it('does not store NaN when a trial-count field is cleared', () => {
    const design = new CustomDesign(makeProps());
    design.setState = ((update) => {
      const patch =
        typeof update === 'function'
          ? update(design.state, design.props)
          : update;
      design.state = { ...design.state, ...patch };
    }) as typeof design.setState;

    design.setState({
      params: { ...design.state.params, nbTrials: 40, nbPracticeTrials: 8 },
    });

    const empty = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
    design.handleTrialCountChange('nbTrials')(empty);
    design.handleTrialCountChange('nbPracticeTrials')(empty);

    expect(Number.isNaN(design.state.params.nbTrials)).toBe(false);
    expect(Number.isNaN(design.state.params.nbPracticeTrials)).toBe(false);
    expect(design.state.params.nbTrials).toBe(0);
    expect(design.state.params.nbPracticeTrials).toBe(0);
  });

  it('does not remap keys already saved on the experiment', () => {
    const design = new CustomDesign(
      makeProps({
        ...params,
        stimulus1: {
          ...params.stimulus1,
          dir: '/a',
          response: '1',
        },
        stimulus2: {
          ...params.stimulus2,
          dir: '/b',
          response: '9',
        },
        stimulus3: {
          ...params.stimulus3,
          dir: '/c',
          type: EVENTS.STIMULUS_3,
          response: '2',
        },
      })
    );
    expect(design.state.params.stimulus1?.response).toBe('1');
    expect(design.state.params.stimulus2?.response).toBe('9');
    expect(design.state.params.stimulus3?.response).toBe('2');
  });
});
