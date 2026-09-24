import { overview as facesOverview } from '../../experiments/faces_houses/content_overview';
import { background as facesBackground } from '../../experiments/faces_houses/content_background';
import { protocol as facesProtocol } from '../../experiments/faces_houses/content_protocol';
import { params as facesParams } from '../../experiments/faces_houses/params';

import { overview as stroopOverview } from '../../experiments/stroop/content_overview';
import { background as stroopBackground } from '../../experiments/stroop/content_background';
import { protocol as stroopProtocol } from '../../experiments/stroop/content_protocol';
import { params as stroopParams } from '../../experiments/stroop/params';

import { overview as searchOverview } from '../../experiments/search/content_overview';
import { background as searchBackground } from '../../experiments/search/content_background';
import { protocol as searchProtocol } from '../../experiments/search/content_protocol';
import { params as searchParams } from '../../experiments/search/params';

import facesIcon from '../../experiments/faces_houses/icon.png';
import brad from '../../assets/common/brad.png';

import { FlowPhase, PrepareStepsProps } from './PrepareSteps';

export interface PrepareFixture {
  heading: string;
  overview: PrepareStepsProps['overview'];
  background: PrepareStepsProps['background'];
  protocol: PrepareStepsProps['protocol'];
  icon?: string;
  expectedKeys: { label: string; key?: string }[];
  flow: FlowPhase[];
}

/**
 * Build expected keys from the first two stimuli that differ by condition.
 * Falls back to a single "press any key" mapping when labels are unavailable.
 */
function keysFromStimuli(stimuli: { condition?: string; response?: string }[]) {
  const byCondition = new Map<string, string>();
  for (const stimulus of stimuli) {
    const condition = stimulus.condition;
    const response = stimulus.response;
    if (condition && response && !byCondition.has(condition)) {
      byCondition.set(condition, response);
    }
  }
  const entries = Array.from(byCondition.entries());
  if (entries.length === 0) {
    return [{ label: 'Press the key shown on screen' }];
  }
  return entries.map(([label, key]) => ({ label, key }));
}

function buildFlow(params: {
  includePractice?: boolean;
  nbPracticeTrials?: number;
  nbTrials: number;
}): FlowPhase[] {
  const phases: FlowPhase[] = [{ label: 'Instructions' }];
  if (params.includePractice && (params.nbPracticeTrials ?? 0) > 0) {
    phases.push({ label: 'Practice trials', count: params.nbPracticeTrials });
  }
  phases.push({ label: 'Main-task reminder' });
  phases.push({ label: 'Recorded trials', count: params.nbTrials });
  phases.push({ label: 'Completion' });
  return phases;
}

export const FACES_HOUSES: PrepareFixture = {
  heading: 'Faces/Houses',
  overview: facesOverview,
  background: { ...facesBackground, fun_fact_image: brad },
  protocol: facesProtocol,
  icon: facesIcon,
  expectedKeys: keysFromStimuli(facesParams.stimuli ?? []),
  flow: buildFlow({
    includePractice: facesParams.includePractice,
    nbPracticeTrials: facesParams.nbPracticeTrials,
    nbTrials: facesParams.nbTrials,
  }),
};

export const STROOP: PrepareFixture = {
  heading: 'Stroop',
  overview: stroopOverview,
  background: stroopBackground,
  protocol: stroopProtocol,
  expectedKeys: keysFromStimuli(stroopParams.stimuli ?? []),
  flow: buildFlow({ nbTrials: stroopParams.nbTrials }),
};

export const SEARCH: PrepareFixture = {
  heading: 'Visual Search',
  overview: searchOverview,
  background: searchBackground,
  protocol: searchProtocol,
  expectedKeys: keysFromStimuli(searchParams.stimuli ?? []),
  flow: buildFlow({ nbTrials: searchParams.nbTrials }),
};

export const CUSTOM: PrepareFixture = {
  heading: 'Custom',
  overview: {
    title: 'My Custom Experiment',
    overview:
      'In this experiment, students see images you choose and press a key for each one.',
    links: [],
  },
  background: {
    first_column_statement:
      'Custom experiments let you test your own questions using pictures and sounds you provide.',
    definition_title: 'Research question',
    first_column_question: 'What do you want to find out?',
    second_column_statement:
      'You choose the conditions, response keys, and trials.',
    second_column_question: '',
    links: [],
  },
  protocol: {
    title: 'What participants are shown',
    protocol:
      'Participants see one stimulus at a time and press the key you assigned to its condition.',
    condition_first_img: '',
    condition_first_title: 'Condition 1',
    condition_first: 'Press the assigned key for Condition 1',
    condition_second_img: '',
    condition_second_title: 'Condition 2',
    condition_second: 'Press the assigned key for Condition 2',
    pacing: 'Go at a comfortable, steady pace.',
  },
  expectedKeys: [
    { label: 'Condition 1', key: '1' },
    { label: 'Condition 2', key: '9' },
  ],
  flow: buildFlow({ nbTrials: 0 }),
};

export const IMPORTED: PrepareFixture & { file: string } = {
  heading: 'Imported',
  overview: {
    title: 'Imported Study',
    overview:
      'This experiment was written outside BrainWaves. BrainWaves runs it and records the responses.',
    links: [],
  },
  background: {
    first_column_statement:
      'Imported studies keep their own instructions and timing.',
    definition_title: 'Markers',
    first_column_question:
      'Name the conditions in the Markers tab so BrainWaves can write EEG markers.',
    second_column_statement:
      'If you do not add conditions, the study runs behavior-only.',
    second_column_question: '',
    links: [],
  },
  protocol: {
    title: 'What participants are shown',
    protocol:
      'The study file controls the trial order, stimuli, and instructions shown to participants.',
    condition_first_img: '',
    condition_first_title: 'Condition A',
    condition_first: 'Declared condition A',
    condition_second_img: '',
    condition_second_title: 'Condition B',
    condition_second: 'Declared condition B',
    pacing: undefined,
  },
  expectedKeys: [
    { label: 'Condition A', key: 'f' },
    { label: 'Condition B', key: 'j' },
  ],
  flow: [
    { label: 'Study instructions' },
    { label: 'Trials' },
    { label: 'Completion' },
  ],
  file: 'my-study.js',
};

/** Shared no-op callbacks so stories do not need to supply handlers. */
export const NOOP_HANDLERS: Pick<
  PrepareStepsProps,
  | 'onStep'
  | 'onCollect'
  | 'onPreviewStart'
  | 'onPreviewStop'
  | 'onPreviewAgain'
> = {
  onStep: () => {},
  onCollect: () => {},
  onPreviewStart: () => {},
  onPreviewStop: () => {},
  onPreviewAgain: () => {},
};
