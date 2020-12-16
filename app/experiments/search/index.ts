// import { stroopExperiment as experimentObject } from './experiment';
import { params } from './params';
import { background } from './content_background';
import { protocol } from './content_protocol';
import { overview } from './content_overview';
import { searchExperimentObject } from './experiment';
import icon from './icon.png';

export default {
  icon,
  experimentObject: searchExperimentObject,
  params,
  text: {
    protocol,
    background,
    overview,
  },
};
