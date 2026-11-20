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
  compare: {
    conditions: ['Mixed rules', 'Single rule'],
    measure: 'Response time, and how often the answer is right',
    whereInAnalyze: 'Behavior tab: Response time, then Accuracy',
  },
  prediction: {
    question:
      'How will response times in the mixed-rules block compare with the single-rule blocks?',
    conditions: ['Mixed rules', 'Single rule'],
    measure: 'rt',
    options: [
      { direction: 'a>b', label: 'Mixed rules slower than Single rule' },
      { direction: 'a=b', label: 'Mixed rules and Single rule about the same speed' },
      { direction: 'a<b', label: 'Mixed rules faster than Single rule' },
    ],
    lookFor:
      'With Measure on Response time, compare the Mixed rules bars with the Single rule bars: a taller Mixed rules bar is the cost of switching rules.',
  },
  teacherNote:
    'Ask the participant to rest one finger on B and one on N: the keys are side by side, so slips are easy. Each trial times out after 5 seconds, and a wrong key brings a 3-second pause.',
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
