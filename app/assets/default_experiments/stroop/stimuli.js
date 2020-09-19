// Default directories containing stimuli
const rootFolder = __dirname; // Note: there's a weird issue where the fs readdir function reads from BrainWaves dir

const facesDir = path.join(rootFolder, 'assets', 'default_experiments', 'face_house', 'faces');
const housesDir = path.join(rootFolder, 'assets', 'default_experiments', 'face_house', 'houses');
const fixation = path.join(rootFolder, 'assets', 'common', 'fixationcross.png');

export const stimuli = Array.from({ length: 30 }, (_, i) => `Face${i + 1}`)
  .concat(Array.from({ length: 30 }, (v, k) => `House${k + 1}`))
  .map((s) => ({
    condition: s.startsWith('Face') ? 'Face' : 'House',
    dir: s.startsWith('Face') ? facesDir : housesDir,
    filename: `${s}.jpg`,
    name: s,
    response: s.startsWith('Face') ? '1' : '9',
    phase: 'main',
    type: s.startsWith('Face') ? EVENTS.STIMULUS_1 : EVENTS.STIMULUS_2,
  }));
