import type { PrepareStepsProps } from './PrepareSteps';

export { prepare as FACES_HOUSES } from '../../experiments/faces_houses/prepare';
export { prepare as STROOP } from '../../experiments/stroop/prepare';
export { prepare as SEARCH } from '../../experiments/search/prepare';
export { prepare as MULTITASKING } from '../../experiments/multitasking/prepare';

/** Faces/Houses Background's video slot, filled with the local Oliver Sacks stand-in. */
export const SACKS_STAND_IN: PrepareStepsProps['mediaFallback'] = {
  caption: 'Oliver Sacks on face blindness',
  alt: 'Illustrated portrait of Oliver Sacks',
};

/** Shared no-op callbacks so stories do not need to supply handlers. */
export const NOOP_HANDLERS: Pick<
  PrepareStepsProps,
  'onStep' | 'onCollect' | 'onPreviewStart' | 'onPreviewStop' | 'onPreviewAgain'
> = {
  onStep: () => {},
  onCollect: () => {},
  onPreviewStart: () => {},
  onPreviewStop: () => {},
  onPreviewAgain: () => {},
};
