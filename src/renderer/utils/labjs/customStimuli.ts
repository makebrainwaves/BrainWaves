import { EVENTS } from '../../constants/constants';
import {
  ExperimentParameters,
  Stimulus,
  StimulusCondition,
} from '../../constants/interfaces';

export type ConditionSlotName =
  | 'stimulus1'
  | 'stimulus2'
  | 'stimulus3'
  | 'stimulus4';

export type ConditionSlot = StimulusCondition;
export const CONDITION_SLOTS: Array<{
  name: ConditionSlotName;
  number: number;
  type: EVENTS;
}> = [
  { name: 'stimulus1', number: 1, type: EVENTS.STIMULUS_1 },
  { name: 'stimulus2', number: 2, type: EVENTS.STIMULUS_2 },
  { name: 'stimulus3', number: 3, type: EVENTS.STIMULUS_3 },
  { name: 'stimulus4', number: 4, type: EVENTS.STIMULUS_4 },
];

export const emptyConditionSlot = (
  type: EVENTS,
  title: string
): ConditionSlot => ({
  dir: '',
  audioDir: '',
  title,
  type,
  response: '',
});

export type ConditionImageList = ConditionSlot & {
  images: string[];
  sounds: string[];
};

/**
 * Builds the trial list from each condition's image/sound folders.
 *
 * A condition can be visual (images), auditory (sounds), or both. Visual and
 * mixed conditions get one trial per image; sounds co-assign to images
 * index-wise, cycling when there are fewer sounds than images, and the pair
 * stays fixed through shuffling (the loop shuffles whole trials). Auditory-only
 * conditions get one trial per sound.
 *
 * 2020 CustomDesign rule: the first trial of each condition is practice.
 */
export function stimuliFromImageLists(slots: ConditionImageList[]): Stimulus[] {
  const stimuli: Stimulus[] = [];
  for (const slot of slots) {
    const images = slot.dir ? slot.images : [];
    const sounds = slot.audioDir ? slot.sounds : [];
    if (images.length === 0 && sounds.length === 0) continue;
    const title = slot.title || `Condition ${slot.type}`;
    const trialCount = images.length > 0 ? images.length : sounds.length;
    for (let index = 0; index < trialCount; index++) {
      const filename = images[index];
      const audioFilename =
        sounds.length > 0 ? sounds[index % sounds.length] : undefined;
      stimuli.push({
        ...(filename ? { dir: slot.dir, filename } : {}),
        ...(audioFilename ? { audioDir: slot.audioDir, audioFilename } : {}),
        title: filename ?? audioFilename!,
        condition: title,
        response: slot.response,
        phase: index === 0 ? 'practice' : 'main',
        type: slot.type,
      });
    }
  }
  return stimuli;
}

export function countPhases(stimuli: Stimulus[]): {
  nbTrials: number;
  nbPracticeTrials: number;
} {
  return {
    nbTrials: stimuli.filter((s) => s.phase === 'main').length,
    nbPracticeTrials: stimuli.filter((s) => s.phase === 'practice').length,
  };
}

export async function rebuildStimuliFromSlots(
  params: ExperimentParameters,
  readImages: (dir: string) => Promise<string[]>,
  readAudioFiles: (dir: string) => Promise<string[]> = async () => []
): Promise<Stimulus[]> {
  const lists: ConditionImageList[] = [];
  for (const slot of CONDITION_SLOTS) {
    const cond = params[slot.name];
    const images = cond?.dir ? await readImages(cond.dir) : [];
    const sounds = cond?.audioDir ? await readAudioFiles(cond.audioDir) : [];
    lists.push({
      dir: cond?.dir ?? '',
      audioDir: cond?.audioDir ?? '',
      title: cond?.title ?? '',
      type: cond?.type ?? slot.type,
      response: cond?.response ?? '',
      images,
      sounds,
    });
  }
  return stimuliFromImageLists(lists);
}
