import { overview as facesOverview } from '../../experiments/faces_houses/content_overview';
import { background as facesBackground } from '../../experiments/faces_houses/content_background';
import { protocol as facesProtocol } from '../../experiments/faces_houses/content_protocol';
import { params as facesParams } from '../../experiments/faces_houses/params';

import { overview as stroopOverview } from '../../experiments/stroop/content_overview';
import { background as stroopBackground } from '../../experiments/stroop/content_background';
import { protocol as stroopProtocol } from '../../experiments/stroop/content_protocol';
import { params as stroopParams } from '../../experiments/stroop/params';

import { overview as searchOverview } from '../../experiments/search/content_overview';
import { background as searchBackground } from '../../experiments/search/content_background';
import { protocol as searchProtocol } from '../../experiments/search/content_protocol';
import { params as searchParams } from '../../experiments/search/params';

import facesIcon from '../../experiments/faces_houses/icon.png';
import face from '../../experiments/faces_houses/stimuli/faces/Face1.jpg';
import house from '../../experiments/faces_houses/stimuli/houses/House1.jpg';
import orangeT from '../../experiments/search/stimuli/conditionOrangeT.png';
import noOrangeT from '../../experiments/search/stimuli/conditionNoOrangeT.png';
import brad from '../../assets/common/brad.png';

import { FlowPhase, PrepareStepsProps } from './PrepareSteps';

export type PrepareFixture = Pick<
  PrepareStepsProps,
  'overview' | 'background' | 'protocol' | 'responses' | 'flow' | 'icon'
>;

function buildFlow(params: {
  includePractice?: boolean;
  nbPracticeTrials?: number;
  nbTrials: number;
}): FlowPhase[] {
  const phases: FlowPhase[] = [{ label: 'Instructions' }];
  if (params.includePractice && (params.nbPracticeTrials ?? 0) > 0) {
    phases.push({ label: 'Practice trials', count: params.nbPracticeTrials });
  }
  phases.push({ label: 'Main-task reminder' });
  phases.push({ label: 'Recorded trials', count: params.nbTrials });
  phases.push({ label: 'Completion' });
  return phases;
}

/** Keys from faces_houses/params.ts stimuli (Face → 1, House → 9). */
export const FACES_HOUSES: PrepareFixture = {
  overview: facesOverview,
  background: { ...facesBackground, fun_fact_image: brad },
  protocol: facesProtocol,
  icon: facesIcon,
  responses: [
    { key: '1', label: 'Face', stimulus: { src: face, alt: 'A face photo' } },
    { key: '9', label: 'House', stimulus: { src: house, alt: 'A house photo' } },
  ],
  flow: buildFlow({
    includePractice: facesParams.includePractice,
    nbPracticeTrials: facesParams.nbPracticeTrials,
    nbTrials: facesParams.nbTrials,
  }),
};

/** Faces/Houses Background's video slot, filled with the local Oliver Sacks stand-in. */
export const SACKS_STAND_IN: PrepareStepsProps['mediaFallback'] = {
  caption: 'Oliver Sacks on face blindness',
  alt: 'Illustrated portrait of Oliver Sacks',
};

/** Keys and ink colors from the Stroop screen in stroop/experiment.ts; the word never matches the ink. */
export const STROOP: PrepareFixture = {
  overview: stroopOverview,
  background: stroopBackground,
  protocol: stroopProtocol,
  responses: [
    { key: 'r', label: 'Red ink', stimulus: { word: 'green', color: 'red' } },
    { key: 'g', label: 'Green ink', stimulus: { word: 'blue', color: 'green' } },
    { key: 'b', label: 'Blue ink', stimulus: { word: 'yellow', color: 'blue' } },
    { key: 'y', label: 'Yellow ink', stimulus: { word: 'red', color: '#ffe32a' } },
  ],
  flow: buildFlow({ nbTrials: stroopParams.nbTrials }),
};

/** Keys from search/experiment.ts (b = orange T present, n = absent). */
export const SEARCH: PrepareFixture = {
  overview: searchOverview,
  background: searchBackground,
  protocol: searchProtocol,
  responses: [
    {
      key: 'b',
      label: 'Orange T is there',
      stimulus: { src: orangeT, alt: 'Letters with one right-side-up orange T' },
    },
    {
      key: 'n',
      label: 'No orange T',
      stimulus: { src: noOrangeT, alt: 'Letters with no right-side-up orange T' },
    },
  ],
  flow: buildFlow({ nbTrials: searchParams.nbTrials }),
};

/** Shared no-op callbacks so stories do not need to supply handlers. */
export const NOOP_HANDLERS: Pick<
  PrepareStepsProps,
  | 'onStep'
  | 'onCollect'
  | 'onPreviewStart'
  | 'onPreviewStop'
  | 'onPreviewAgain'
> = {
  onStep: () => {},
  onCollect: () => {},
  onPreviewStart: () => {},
  onPreviewStop: () => {},
  onPreviewAgain: () => {},
};
