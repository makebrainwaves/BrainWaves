import { isNil } from 'lodash';
import * as path from 'path';
import { readdirSync } from 'fs';
import { EXPERIMENTS } from '../../constants/constants';

import { buildN170Timeline } from './protocols/faceshouses';
import { buildStroopTimeline } from './protocols/stroop';
import { buildMultiTimeline } from './protocols/multi';
import { buildSearchTimeline } from './protocols/search';

import {
  MainTimeline,
  Trial,
  ExperimentParameters
} from '../../constants/interfaces';

// loads a protocol of the experiment
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
    default:
      protocol = buildN170Timeline();
      break;

  }
  return protocol;
};
