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
  title,
  type,
  response: '',
});

export type ConditionImageList = ConditionSlot & { images: string[] };

/** 2020 CustomDesign rule: first image of each condition is practice. */
export function stimuliFromImageLists(
  slots: ConditionImageList[]
): Stimulus[] {
  const stimuli: Stimulus[] = [];
  for (const slot of slots) {
    if (!slot.dir || slot.images.length === 0) continue;
    const title = slot.title || `Condition ${slot.type}`;
    slot.images.forEach((filename, index) => {
      stimuli.push({
        dir: slot.dir,
        filename,
        title: filename,
        condition: title,
        response: slot.response,
        phase: index === 0 ? 'practice' : 'main',
        type: slot.type,
      });
    });
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
  readImages: (dir: string) => Promise<string[]>
): Promise<Stimulus[]> {
  const lists: ConditionImageList[] = [];
  for (const slot of CONDITION_SLOTS) {
    const cond = params[slot.name];
    if (!cond?.dir) {
      lists.push({
        dir: '',
        title: cond?.title ?? '',
        type: slot.type,
        response: cond?.response ?? '',
        images: [],
      });
      continue;
    }
    const images = await readImages(cond.dir);
    lists.push({
      dir: cond.dir,
      title: cond.title,
      type: cond.type ?? slot.type,
      response: cond.response,
      images,
    });
  }
  return stimuliFromImageLists(lists);
}
