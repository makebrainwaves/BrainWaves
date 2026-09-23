import { HomeWorkspace } from './HomeLanding';

export const RECENT_WORKSPACES: HomeWorkspace[] = [
  {
    id: 'Faces_Houses_3',
    name: 'Faces_Houses_3',
    experimentType: 'Faces/Houses',
    modality: 'eeg',
    lastOpened: '2 hours ago',
  },
  {
    id: 'Stroop_Task',
    name: 'Stroop_Task',
    experimentType: 'Stroop',
    modality: 'behavior',
    lastOpened: '5 days ago',
  },
  {
    id: 'Cartoons_and_Sounds',
    name: 'Cartoons_and_Sounds',
    experimentType: 'Experiment Builder',
    modality: 'eeg',
    lastOpened: '5 days ago',
  },
  {
    id: 'Multi-tasking',
    name: 'Multi-tasking',
    experimentType: 'Multi-tasking',
    modality: 'eeg',
    lastOpened: '22 days ago',
  },
];

/** Names the naming dialog checks against: Faces_Houses_3 is the next free one. */
export const EXISTING_FACES_HOUSES_NAMES = ['Faces_Houses', 'Faces_Houses_2'];
