import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import orangeT from './stimuli/conditionOrangeT.png';
import noOrangeT from './stimuli/conditionNoOrangeT.png';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/** What Prepare shows for Visual Search: b = orange T present, n = absent (experiment.ts), and its real 8 / 80 trials. */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  compare: {
    conditions: ['15 and 20 letters', '5 and 10 letters'],
    measure: 'Response time: how long the search takes',
    whereInAnalyze: 'Behavior tab: Response time',
  },
  teacherNote:
    'Check the participant can tell orange from light blue. If you record EEG, ask them to keep their head and body still but let their eyes search the picture.',
  responses: [
    {
      key: 'b',
      label: 'Orange T is there',
      stimulus: {
        src: orangeT,
        alt: 'Letters with one right-side-up orange T',
      },
    },
    {
      key: 'n',
      label: 'No orange T',
      stimulus: {
        src: noOrangeT,
        alt: 'Letters with no right-side-up orange T',
      },
    },
  ],
  // utils.ts: constructTrials makes 8 trials per block; practice = 1 block, main = 10 blocks. params.nbTrials is unused.
  flow: flowFromStructure({ practice: 8, recorded: 80 }),
};
