import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import diamond2 from './stimuli/diamond_2.png';
import diamond3 from './stimuli/diamond_3.png';
import rect2 from './stimuli/rectangle_2.png';
import rect3 from './stimuli/rectangle_3.png';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/**
 * What Prepare shows for Multitasking: two rules on the same b / n keys
 * (utils.ts initTasks: top = shape rule, bottom = dots rule) and its block
 * structure, with no study-wide trial total.
 */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  responses: [
    {
      key: 'b',
      label: 'Top: diamond',
      stimulus: { src: diamond2, alt: 'A diamond; on top, answer the shape' },
    },
    {
      key: 'n',
      label: 'Top: rectangle',
      stimulus: { src: rect3, alt: 'A rectangle; on top, answer the shape' },
    },
    {
      key: 'b',
      label: 'Bottom: 2 dots',
      stimulus: {
        src: rect2,
        alt: 'Two dots; on the bottom, count the dots',
      },
    },
    {
      key: 'n',
      label: 'Bottom: 3 dots',
      stimulus: {
        src: diamond3,
        alt: 'Three dots; on the bottom, count the dots',
      },
    },
  ],
  // experiment.ts 'Block loop': 3 training blocks, then 3 main blocks (shape, dots, then both rules mixed).
  flow: flowFromStructure({
    blocks: [
      { label: 'Practice blocks: shape, dots, then both', practice: 3 },
      { label: 'Recorded blocks: shape, dots, then both', recorded: 3 },
    ],
  }),
};
