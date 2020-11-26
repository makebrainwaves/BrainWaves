import { EVENTS } from '../../../constants/constants';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 1000,
  jitter: 200,
  sampleType: 'with-replacement',
  intro: `In this task you will learn about multitasking difficulties using a
  task mixing and switching paradigm. You will go through several instruction
  and training blocks and then several blocks of real data collection will
  follow. Press the space bar to continue with the instructions.`,
  showProgressBar: false,
  stimulus1: {
    title: 'No switching',
    type: EVENTS.STIMULUS_1,
    response: '1',
  },
  stimulus2: {
    title: 'Switching',
    type: EVENTS.STIMULUS_2,
    response: '9',
  }
}
