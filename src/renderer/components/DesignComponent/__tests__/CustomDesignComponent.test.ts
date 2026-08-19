import { describe, expect, it, vi } from 'vitest';

vi.mock('lab.js', () => ({}));
import { EXPERIMENTS } from '../../../constants/constants';
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

const makeProps = (): DesignProps =>
  ({
    navigate: vi.fn(),
    type: EXPERIMENTS.CUSTOM,
    title: 'My_Custom',
    params,
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
});
