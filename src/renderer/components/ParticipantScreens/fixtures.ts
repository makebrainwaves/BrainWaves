import { EVENTS } from '../../constants/constants';
import type { ExperimentParameters } from '../../constants/interfaces';

const slot = (type: EVENTS, title: string, response: string) => ({
  type,
  title,
  dir: `/pics/${title.toLowerCase()}`,
  audioDir: '',
  response,
});
const emptySlot = (type: EVENTS) => ({
  type,
  title: '',
  dir: '',
  audioDir: '',
  response: '',
});

/** Two keyed conditions and one watched-only condition. */
export const CUSTOM_PARAMS = {
  stimulus1: slot(EVENTS.STIMULUS_1, 'Dog', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Cat', '9'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Bird', ''),
  stimulus4: emptySlot(EVENTS.STIMULUS_4),
} as unknown as ExperimentParameters;

export const CUSTOM_INTRO =
  "You'll see pictures of animals. Press the key for the animal you see.";

/** Four conditions on the default keys for four (1, 4, 6, 9). */
export const CUSTOM_FOUR_KEYS_PARAMS = {
  stimulus1: slot(EVENTS.STIMULUS_1, 'Monkey', '1'),
  stimulus2: slot(EVENTS.STIMULUS_2, 'Parrot', '4'),
  stimulus3: slot(EVENTS.STIMULUS_3, 'Frog', '6'),
  stimulus4: slot(EVENTS.STIMULUS_4, 'Jaguar', '9'),
} as unknown as ExperimentParameters;

/** Stress case: a teacher intro as long as the four-row intro textarea holds. */
export const CUSTOM_LONG_INTRO =
  "In this experiment you'll see photos of four rainforest animals, one at a time, in the middle of the screen. Each photo stays up for about a second. As soon as you recognize the animal, press its key. Keep your fingers resting on the four keys the whole time so you don't have to look down. If you're not sure, make your best guess and get ready for the next photo.";
