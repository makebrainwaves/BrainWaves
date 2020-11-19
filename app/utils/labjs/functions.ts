import { EXPERIMENTS } from '../../constants/constants';
import { Experiment } from '../../constants/interfaces';
import facesHousesExperiment from '../../experiments/faces_houses';

// Returns  all data necessary to fully describe an experiment from the experiment type
// Used in order to instantiate experiment state in redux when creating a new workspace,
// Consumers can access whichever field they are interested in
export function getExperimentFromType(type: EXPERIMENTS): Experiment {
  switch (type) {
    case EXPERIMENTS.CUSTOM:
      return facesHousesExperiment;
    case EXPERIMENTS.MULTI:
      return facesHousesExperiment;
    case EXPERIMENTS.N170:
      return facesHousesExperiment;
    case EXPERIMENTS.NONE:
      return facesHousesExperiment;
    case EXPERIMENTS.P300:
      return facesHousesExperiment;
    case EXPERIMENTS.SEARCH:
      return facesHousesExperiment;
    case EXPERIMENTS.SSVEP:
      return facesHousesExperiment;
    case EXPERIMENTS.STROOP:
    default:
      return facesHousesExperiment;
  }
}
