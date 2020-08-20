import { EXPERIMENTS } from '../../constants/constants';

import { buildN170Timeline } from './protocols/faceshouses';
import { buildStroopTimeline } from './protocols/stroop';
import { buildMultiTimeline } from './protocols/multi';
import { buildSearchTimeline } from './protocols/search';
import { buildCustomTimeline } from './protocols/custom';

// loads a protocol of the experiment
// TODO refactor this experiment description system to be much more predictable
export const loadProtocol = (paradigm: EXPERIMENTS) => {
  let protocol;
  switch (paradigm) {
    case EXPERIMENTS.STROOP:
      protocol = buildStroopTimeline();
      break;

    case EXPERIMENTS.MULTI:
      protocol = buildMultiTimeline();
      break;

    case EXPERIMENTS.SEARCH:
      protocol = buildSearchTimeline();
      break;

    case EXPERIMENTS.N170:
      protocol = buildN170Timeline();
      break;

    case EXPERIMENTS.CUSTOM:
    default:
      protocol = buildCustomTimeline();
      break;
  }
  return protocol;
};
