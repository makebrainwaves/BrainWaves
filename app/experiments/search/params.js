import { EVENTS } from '../../constants/constants';

export const params = {
  trialDuration: 1000,
  nbTrials: 150,
  iti: 500,
  jitter: 200,
  sampleType: 'with-replacement',
  intro: `You know how difficult it is to find your keys in a messy room. We
  want to know how good you are in quickly finding your keys. Instead of keys,
  we just want to know how quickly you can find an orange T amongst blue Ts
  and upside-down orange Ts. Sounds easy! But it is not at all that easy!`,
  showProgressBar: false,
  stimulus1: {
    title: '5 and 10 letters',
    type: EVENTS.STIMULUS_1,
    response: '1',
  },
  stimulus2: {
    title: '15 and 20 letters',
    type: EVENTS.STIMULUS_2,
    response: '9',
  },
};
