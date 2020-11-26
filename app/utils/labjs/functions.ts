import * as lab from 'lab.js';
import { ComponentOptions } from 'lab.js/dist/types';
import path from 'path';
import { EXPERIMENTS } from '../../constants/constants';
import {
  Experiment,
  ExperimentParameters,
  Stimulus,
} from '../../constants/interfaces';
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

// Initializes a Loop component with a provided list of stimuli and other parameters extracted from experiment parameters
export function initLoopWithStimuli(this: lab.flow.Loop) {
  const {
    parameters: { stimuli, nbTrials, randomize },
  }: { parameters: ExperimentParameters } = this;

  const balancedStimuli = balanceStimuliByCondition(stimuli, nbTrials);

  this.options.templateParameters = balancedStimuli;
  this.options.shuffle = randomize === 'random';
}

// Initializes a Loop component with a provided list of stimuli and other parameters extracted from experiment parameters
// uses nbPracticeTrials
export function initPracticeLoopWithStimuli(this: lab.flow.Loop) {
  const {
    parameters: { stimuli, nbPracticeTrials, randomize },
  }: { parameters: ExperimentParameters } = this;

  if (!nbPracticeTrials) return;

  const balancedStimuli = balanceStimuliByCondition(stimuli, nbPracticeTrials);

  this.options.templateParameters = balancedStimuli;
  this.options.shuffle = randomize === 'random';
}

function balanceStimuliByCondition(stimuli: Stimulus[], nbTrials: number) {
  if (stimuli.length === 0 || nbTrials === 0) {
    return [];
  }

  const conditions = new Set(stimuli.map((p) => p.condition));
  const conditionsParameters = [...conditions].reduce(
    (acc, curr) => ({
      ...acc,
      [curr ? curr : 'default']: stimuli.filter(
        (stimulus) => stimulus.condition === curr
      ),
    }),
    {}
  );

  const nbTrialsPerCondition = Math.ceil(
    nbTrials / Object.keys(conditionsParameters).length
  );

  // balance design across conditions
  const balancedStimuli: Stimulus[] = [];
  for (const condition of conditions) {
    if (!condition) return;

    for (let i = 0; i < nbTrialsPerCondition; i++) {
      balancedStimuli.push(
        conditionsParameters[condition][
          i % conditionsParameters[condition].length
        ]
      );
    }
  }

  // Add filepath parameter for lab.js usage convenience
  const balancedStimuliWithFilePath = balancedStimuli.map((stimulus) => ({
    ...stimulus,
    filepath: path.join(stimulus.dir, stimulus.filename),
  }));

  return balancedStimuliWithFilePath;
}

export function initResponseHandlers(this: lab.core.Component) {
  const {
    options: { id },
    parameters: { response },
  }: { parameters: Stimulus; options: ComponentOptions } = this;
  if (!id) return;

  // Arguments = stimuli, this.options.id, this.data, this.options.events
  // This code registers an event listener for this screen.
  // We have a timeout for this screen, but we also want to record responses.
  // On a keydown event, we record the key and the time of response.
  // We also record whether the response was correct (by comparing the pressed key with the correct response which is defined inside the Experiment loop).
  // "this" in the code means the lab.js experiment.

  this.data.trial_number =
    1 + parseInt(id.split('_')[id.split('_').length - 2], 10);
  this.data.response_given = 'no';

  this.options.events = {
    keydown: (event: { key: number }) => {
      const keyPressed = String(event.key);
      this.data.reaction_time = this.timer;
      this.data.response_given = 'yes';
      this.data.response = keyPressed;
      if (this.data.response === response) {
        this.data.correct_response = true;
      } else {
        this.data.correct_response = false;
      }
      this.end();
    },
  };
}

export function triggerEEGCallback(this: lab.core.Component) {
  this.parameters.callbackForEEG(this.parameters.type);
}

export function resetCorrectResponse(this: lab.core.Component) {
  this.data.correct_response = false;
}
