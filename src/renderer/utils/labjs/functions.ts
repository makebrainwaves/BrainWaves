import * as lab from 'lab.js';
import path from 'pathe';
import { EXPERIMENTS } from '../../constants/constants';
import {
  Experiment,
  ExperimentParameters,
  Stimulus,
} from '../../constants/interfaces';
import facesHousesExperiment from '../../experiments/faces_houses';
import stroopExperiment from '../../experiments/stroop';
import customExperiment from '../../experiments/custom';
import searchExperiment from '../../experiments/search';
import multitaskingExperiment from '../../experiments/multitasking';
import { toStimulusFileUrl } from '../../../shared/stimulusUrl';

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
    case EXPERIMENTS.SEARCH:
      return searchExperiment;
    case EXPERIMENTS.CUSTOM:
      return customExperiment;
    case EXPERIMENTS.NONE:
    case EXPERIMENTS.N170:
    default:
      return facesHousesExperiment;
  }
}

// `phase` in the recorded data means "which block did this trial run in", and
// only the running loop knows that — the value on a stimulus is just how the
// designer counted the trial list up (see countPhases). Both loops draw from
// the same pool, so each stamps its own block on. Passing the stimulus tag
// through instead made behavior/compute mis-bin trials: custom tags the first
// image of each condition 'practice', so a slice of the real task was dropped,
// while faces_houses tags everything 'main', so practice was analysed as data.
export function initLoopWithStimuli(
  this: lab.flow.Loop<Record<string, unknown>>
) {
  const {
    parameters: { stimuli, nbTrials, randomize },
  }: { parameters: ExperimentParameters } = this;

  this.options.templateParameters = balanceStimuliByCondition(
    stimuli,
    nbTrials
  ).map((stimulus) => ({ ...stimulus, phase: 'main' }));
  this.options.shuffle = randomize === 'random';
}

// As initLoopWithStimuli, but sized by nbPracticeTrials.
export function initPracticeLoopWithStimuli(
  this: lab.flow.Loop<Record<string, unknown>>
) {
  const {
    parameters: { stimuli, nbPracticeTrials, randomize },
  }: { parameters: ExperimentParameters } = this;

  if (!nbPracticeTrials) return;

  this.options.templateParameters = balanceStimuliByCondition(
    stimuli,
    nbPracticeTrials
  ).map((stimulus) => ({ ...stimulus, phase: 'practice' }));
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
  if (
    !stimuli ||
    stimuli.length === 0 ||
    !Number.isFinite(nbTrials) ||
    nbTrials <= 0
  ) {
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

  // balance design across conditions. Iterate the bucket keys (stimuli with no
  // condition land in the 'default' bucket) so a missing condition doesn't bail
  // out of the whole function and yield an empty experiment.
  const balancedStimuli: Stimulus[] = [];
  for (const condition of Object.keys(conditionsParameters)) {
    const bucket = conditionsParameters[condition];
    for (let i = 0; i < nbTrialsPerCondition; i++) {
      balancedStimuli.push(bucket[i % bucket.length]);
    }
  }

  // Add filepath/audiopath parameters for lab.js usage convenience
  const balancedStimuliWithFilePath = balancedStimuli.map((stimulus) => ({
    ...stimulus,
    ...(stimulus.dir && stimulus.filename
      ? {
          filepath: toStimulusFileUrl(
            path.join(stimulus.dir, stimulus.filename)
          ),
        }
      : {}),
    ...(stimulus.audioDir && stimulus.audioFilename
      ? {
          audiopath: toStimulusFileUrl(
            path.join(stimulus.audioDir, stimulus.audioFilename)
          ),
        }
      : {}),
  }));

  return balancedStimuliWithFilePath;
}

/**
 * This code registers an event listener for this screen.
 * On a keydown event, we record the key and the time of response.
 * We also record whether the response was correct (by comparing
 * the pressed key with the correct response which is defined inside the Experiment loop).
 */
export function initResponseHandlers(this: lab.core.Component) {
  // this.id is assigned by prepareNested (e.g. "0_1_0_1"), but this.options.id
  // is undefined for loop-cloned components because rawOptions never has an id.
  // Use this.id directly.
  const id = this.id;
  if (!id) return;

  this.data.trial_number =
    1 + parseInt(id.split('_')[id.split('_').length - 2], 10);
  this.data.response_given = 'no';

  this.options.events = {
    // @ts-expect-error lab.js event map is untyped
    keydown: (event: { key: string }) => {
      // Read at press time. Loop templateParameters land on the parent
      // sequence; closing over `response` in before:prepare can see ''.
      const expected = String(
        (this.parameters as unknown as Stimulus).response ?? ''
      );
      const keyPressed = String(event.key);
      this.data.reaction_time = this.timer;
      this.data.response_given = 'yes';
      this.data.response = keyPressed;
      if (expected === '') {
        // No key was configured for this condition, so correctness is unknown.
        // Recording `false` would look exactly like a participant who got every
        // trial wrong and silently flatten the whole session to 0% accuracy.
        console.error(
          `initResponseHandlers: condition "${
            (this.parameters as unknown as Stimulus).condition ?? '?'
          }" has no expected response key; correctness cannot be scored.`
        );
      } else {
        this.data.correct_response = keyPressed === expected;
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
