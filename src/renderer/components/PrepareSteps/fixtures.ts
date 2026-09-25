import type { PrepareStepsProps } from './PrepareSteps';

export { prepare as FACES_HOUSES } from '../../experiments/faces_houses/prepare';
export { prepare as STROOP } from '../../experiments/stroop/prepare';
export { prepare as SEARCH } from '../../experiments/search/prepare';
export { prepare as MULTITASKING } from '../../experiments/multitasking/prepare';

/** Shared no-op callbacks, with EEG on, so stories show the Design screen's full action row. */
export const NOOP_HANDLERS: Pick<
  PrepareStepsProps,
  | 'onStep'
  | 'onCollect'
  | 'onPreviewStart'
  | 'onPreviewStop'
  | 'onPreviewAgain'
  | 'isEEGEnabled'
  | 'onEEGEnabledChange'
  | 'onCustomize'
> = {
  onStep: () => {},
  onCollect: () => {},
  onPreviewStart: () => {},
  onPreviewStop: () => {},
  onPreviewAgain: () => {},
  isEEGEnabled: true,
  onEEGEnabledChange: () => {},
  onCustomize: () => {},
};
