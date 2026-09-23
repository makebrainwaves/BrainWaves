import { HomeWorkspace } from './HomeLanding';

export const RECENT_WORKSPACES: HomeWorkspace[] = [
  {
    name: 'Faces_Houses_3',
    experimentType: 'Faces/Houses',
    modality: 'eeg',
    lastOpened: '2 hours ago',
  },
  {
    name: 'Stroop_Task',
    experimentType: 'Stroop',
    modality: 'behavior',
    lastOpened: '5 days ago',
  },
  {
    name: 'Cartoons_and_Sounds',
    experimentType: 'Experiment Builder',
    modality: 'eeg',
    lastOpened: '5 days ago',
  },
  {
    name: 'Multi-tasking',
    experimentType: 'Multi-tasking',
    modality: 'eeg',
    lastOpened: '22 days ago',
  },
];

/** Names the naming dialog checks against: Faces_Houses_3 is the next free one. */
export const EXISTING_FACES_HOUSES_NAMES = ['Faces_Houses', 'Faces_Houses_2'];
