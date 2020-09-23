import * as path from 'path';
import { EVENTS } from '../../../constants/constants';

// TODO: properly modify this for the oddball study
// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const catsDir = path.join(
  rootFolder,
  'assets',
  'default_experiments',
  'cat_dog',
  'stimuli',
  'cats'
);
const dogsDir = path.join(
  rootFolder,
  'assets',
  'default_experiments',
  'cat_dog',
  'stimuli',
  'dogs'
);
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const stimuli = Array.from({ length: 30 }, (_, i) => `Face${i + 1}`)
  .concat(Array.from({ length: 30 }, (v, k) => `House${k + 1}`))
  .map((s) => ({
    condition: s.startsWith('Cat') ? 'Cat' : 'Dog',
    dir: s.startsWith('cats') ? catsDir : dogsDir,
    filename: `${s}.jpg`,
    name: s,
    response: s.startsWith('Cat') ? '1' : '9',
    phase: 'main',
    type: s.startsWith('Cat') ? EVENTS.STIMULUS_1 : EVENTS.STIMULUS_2,
  }));
