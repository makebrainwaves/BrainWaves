import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../../constants/constants';
import type { ExperimentParameters } from '../../../constants/interfaces';
import {
  customInstructionsScreen,
  customResponseRules,
  customTransitionScreen,
} from '../customStimuli';

const slot = (type: EVENTS, title: string, dir: string, response: string) => ({
  type,
  title,
  dir,
  audioDir: '',
  response,
});

const params = {
  intro: 'Look at ${danger} each animal',
  stimulus1: slot(EVENTS.STIMULUS_1, 'Dog', '/pics/dogs', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Condition 2', '/pics/cats', '9'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Bird', '/pics/birds', ''),
  stimulus4: slot(EVENTS.STIMULUS_4, '', '', ''),
} as unknown as ExperimentParameters;

describe('custom participant screens', () => {
  it('list every condition with a folder, its key, and no empty slots', () => {
    expect(customResponseRules(params)).toEqual([
      {
        keys: [
          { key: '1', meaning: 'Dog' },
          { key: '9', meaning: 'cats' },
          { key: undefined, meaning: 'Bird' },
        ],
      },
    ]);
  });

  it('show the configured keys before practice and again before the recorded task', () => {
    for (const html of [
      customInstructionsScreen(params),
      customTransitionScreen(params),
    ]) {
      expect(html).toContain('<kbd class="bw-participant-key">1</kbd>');
      expect(html).toContain('<kbd class="bw-participant-key">9</kbd>');
      expect(html).toContain('No key');
    }
  });

  it("keeps the teacher's intro out of the template source", () => {
    const html = customInstructionsScreen(params);
    expect(html).toContain('${this.parameters.intro}');
    expect(html).not.toContain('${danger}');
  });
});
