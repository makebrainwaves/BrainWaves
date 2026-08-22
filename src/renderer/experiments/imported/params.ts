import { ExperimentParameters } from '../../constants/interfaces';

/**
 * An imported study owns its own trial structure, timing, and instructions —
 * they live in the author's file, not here. These fields exist only because
 * ExperimentParameters requires them and shared Design/Collect code reads them.
 */
export const params = {
  intro: '',
  iti: 0,
  nbTrials: 0,
  presentationTime: 0,
  randomize: 'sequential',
  sampleType: 'with-replacement',
  showProgressBar: false,
  stimuli: [],
  taskHelp: '',
  trialDuration: 0,
  imported: {
    kind: 'jspsych',
    file: '',
    conditionKey: '',
    correctKey: '',
    conditionLabels: [],
  },
} satisfies ExperimentParameters;
