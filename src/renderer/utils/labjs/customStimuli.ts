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

const DEFAULT_CONDITION_TITLE = /^Condition \d+$/;

/** Folder basename when the slot still has the placeholder "Condition N" title. */
export function titleFromFolder(dir: string, currentTitle: string): string {
  const trimmed = currentTitle.trim();
  if (trimmed !== '' && !DEFAULT_CONDITION_TITLE.test(trimmed)) {
    return currentTitle;
  }
  return dir.split(/[/\\]/).filter(Boolean).pop() || currentTitle;
}

/**
 * The name a condition is recorded under: behaviour CSV `condition` column, ERP
 * legend, and trial-balancing bucket all key off it, so it must never be empty.
 * Sound-only conditions start with a blank title and no image folder, which
 * used to collapse all their trials into one unnamed bucket.
 */
export const conditionTitle = (slot: ConditionSlot): string =>
  titleFromFolder(slot.dir || slot.audioDir || '', slot.title ?? '').trim() ||
  `Condition ${slot.type}`;

/** Farthest-spaced number keys for 1–4 active conditions. */
export const DEFAULT_RESPONSE_KEYS: Record<1 | 2 | 3 | 4, readonly string[]> = {
  1: ['1'],
  2: ['1', '9'],
  3: ['1', '5', '9'],
  4: ['1', '4', '6', '9'],
};

const isActiveSlot = (slot: ConditionSlot | undefined) =>
  Boolean(slot && (slot.dir || slot.audioDir));

/**
 * Give every active condition a farthest-spaced number key: 1 → "1", 2 → "1/9",
 * 3 → "1/5/9", 4 → "1/4/6/9". Adding a condition re-spaces the whole set, but
 * only while every key in use is still one this function picked. Once the
 * student chooses their own key the existing assignment is left alone and only
 * conditions with no key yet are filled from the unused ones.
 */
export function assignDefaultResponses(
  params: ExperimentParameters
): ExperimentParameters {
  const active = CONDITION_SLOTS.filter(({ name }) =>
    isActiveSlot(params[name])
  );
  const n = active.length;
  if (n < 1 || n > 4) return params;
  const keys = DEFAULT_RESPONSE_KEYS[n as 1 | 2 | 3 | 4];

  const assigned = active
    .map(({ name }) => params[name]?.response ?? '')
    .filter((response) => response !== '');
  const previousKeys: readonly string[] =
    assigned.length >= 1
      ? DEFAULT_RESPONSE_KEYS[assigned.length as 1 | 2 | 3 | 4]
      : [];
  const isStillDefault =
    assigned.length === 0 ||
    assigned.every((response, i) => response === previousKeys[i]);
  const spare = keys.filter((key) => !assigned.includes(key));

  const next: ExperimentParameters = { ...params };
  active.forEach(({ name }, i) => {
    const slot = next[name];
    if (!slot) return;
    if (isStillDefault) {
      next[name] = { ...slot, response: keys[i] };
      return;
    }
    if (!slot.response) {
      const key = spare.shift();
      if (key) next[name] = { ...slot, response: key };
    }
  });

  if (next.stimuli) {
    next.stimuli = next.stimuli.map((stimulus) => {
      const slot = CONDITION_SLOTS.find(({ type }) => type === stimulus.type);
      const response = slot ? next[slot.name]?.response : undefined;
      return response && response !== stimulus.response
        ? { ...stimulus, response }
        : stimulus;
    });
  }
  return next;
}

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
    const title = conditionTitle(slot);
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
