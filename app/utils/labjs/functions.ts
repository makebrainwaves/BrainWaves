import { EXPERIMENTS } from '../../constants/constants';

import buildN170Timeline from '../../assets/default_experiments/faces_houses';
import buildStroopTimeline from '../../assets/default_experiments/stroop';
import buildMultiTimeline from '../../assets/default_experiments/multitasking';
import buildSearchTimeline from '../../assets/default_experiments/search';

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
      protocol = {};
      break;
  }
  return protocol;
};
