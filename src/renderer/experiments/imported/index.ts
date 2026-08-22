import { Experiment } from '../../constants/interfaces';
import { params } from './params';
import { overview, background, protocol } from './content';

const importedExperiment: Experiment = {
  experimentObject: {},
  icon: '',
  params,
  text: {
    background,
    overview,
    protocol,
  },
};

export default importedExperiment;
