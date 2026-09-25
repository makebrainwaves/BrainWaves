import { overview } from './content_overview';
import { background } from './content_background';
import { protocol } from './content_protocol';
import icon from './icon.png';
import face from './stimuli/faces/Face1.jpg';
import house from './stimuli/houses/House1.jpg';
import type { PrepareFixture } from '../../components/PrepareSteps/PrepareSteps';
import { flowFromStructure } from '../../components/PrepareSteps/flow';

/** What Prepare shows for Faces/Houses: its keys (params.ts stimuli) and its real 6 / 120 trials. */
export const prepare: PrepareFixture = {
  overview,
  background,
  protocol,
  icon,
  responses: [
    { key: '1', label: 'Face', stimulus: { src: face, alt: 'A face photo' } },
    {
      key: '9',
      label: 'House',
      stimulus: { src: house, alt: 'A house photo' },
    },
  ],
  // Practice and Experiment loops are sized by params.ts nbPracticeTrials 6 / nbTrials 120 (functions.ts initPracticeLoopWithStimuli / initLoopWithStimuli).
  flow: flowFromStructure({ practice: 6, recorded: 120 }),
};
