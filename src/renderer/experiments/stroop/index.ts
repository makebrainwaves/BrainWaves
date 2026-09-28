import { stroopExperiment as experimentObject } from './experiment';
import { params } from './params';
import { background } from './content_background';
import { protocol } from './content_protocol';
import { overview } from './content_overview';
import icon from './icon.png';
import { prepare } from './prepare';

export default {
  icon,
  experimentObject,
  params,
  prepare,
  text: {
    protocol,
    background,
    overview,
  },
};
