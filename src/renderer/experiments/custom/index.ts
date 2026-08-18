import { facesHousesExperiment as experimentObject } from '../faces_houses/experiment';
import { params } from './params';
import { background } from './content_background';
import { protocol } from './content_protocol';
import { overview } from './content_overview';
import icon from './icon.png';
import type { Experiment } from '../../constants/interfaces';

export default {
  icon,
  experimentObject,
  params,
  text: {
    protocol,
    background,
    overview,
  },
} as Experiment;
