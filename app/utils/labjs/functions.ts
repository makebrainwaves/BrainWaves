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
import stroopExperiment from '../../experiments/stroop';
// import customExperiment from '../../experiments/custom';
import searchExperiment from '../../experiments/search';
import multitaskingExperiment from '../../experiments/multitasking';

/**
 * Returns  all data necessary to fully describe an experiment from the experiment type
 * Used in order to instantiate experiment state in redux when creating a new workspace,
 * Consumers can access whichever field they are interested in
 */
export function getExperimentFromType(type: EXPERIMENTS): Experiment {
  switch (type) {
    case EXPERIMENTS.MULTI:
      return multitaskingExperiment;
    case EXPERIMENTS.STROOP:
      return stroopExperiment;
    case EXPERIMENTS.NONE:
      return facesHousesExperiment;
    // case EXPERIMENTS.CUSTOM:
    // return facesHousesExperiment;
    // case EXPERIMENTS.P300:
    //   return p300Experiment;
    case EXPERIMENTS.SEARCH:
      return searchExperiment;
    // case EXPERIMENTS.SSVEP:
    //   return ssvepExperiment;
    case EXPERIMENTS.N170:
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

/**
 * Ensures that the experiment will display equal numbers of each type of stimuli
 *  If asset files are included in the stimuli, will also ensure there is a convenient filepath
 * field that can be used to render the assets in the experiment
 */
function balanceStimuliByCondition(
  stimuli: Stimulus[] | undefined,
  nbTrials: number
) {
  if (!stimuli || stimuli.length === 0 || nbTrials === 0) {
    return [];
  }

  const conditions = new Set(stimuli.map((p) => p.condition));
  const conditionsParameters = [...conditions].reduce(
    (acc, curr) => ({
      ...acc,
      [curr || 'default']: stimuli.filter(
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
  const balancedStimuliWithFilePath = balancedStimuli.map((stimulus) => {
    if (stimulus.dir && stimulus.filename) {
      return {
        ...stimulus,
        filepath: path.join(stimulus.dir, stimulus.filename),
      };
    }
    return stimulus;
  });

  return balancedStimuliWithFilePath;
}

/**
 * This code registers an event listener for this screen.
 * On a keydown event, we record the key and the time of response.
 * We also record whether the response was correct (by comparing
 * the pressed key with the correct response which is defined inside the Experiment loop).
 */
export function initResponseHandlers(this: lab.core.Component) {
  const {
    options: { id },
    parameters: { response },
  }: { parameters: Stimulus; options: ComponentOptions } = this;
  if (!id) return;

  this.data.trial_number =
    1 + parseInt(id.split('_')[id.split('_').length - 2], 10);
  this.data.response_given = 'no';

  this.options.events = {
    // @ts-expect-error
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

// -------------------------------------------------------------
// Stroop

// Initializes the data required to compute response accuracy in the stroop experiment
export function initStroopTrial(this: lab.core.Component) {
  if (!this.options.id) {
    return;
  }
  this.data.trial_number =
    1 +
    parseInt(
      this.options.id.split('_')[this.options.id.split('_').length - 2],
      10
    );

  this.data.condition =
    this.parameters.congruent === 'yes' ? 'Match' : 'Mismatch';

  this.data.reaction_time = this.state.duration;

  if (this.state.response === this.parameters.color) {
    this.data.correct_response = true;
  } else {
    this.data.correct_response = false;
  }

  this.data.response_given = this.state.correct === 'empty' ? 'no' : 'yes';
}
