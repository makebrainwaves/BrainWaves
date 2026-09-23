import { SIGNAL_QUALITY } from '../../constants/constants';
import { FoundHeadset } from './HeadsetSetup';
import { SensorReading } from './SignalPrep';

export const FOUND_MUSE: FoundHeadset = {
  id: 'muse-4a2f',
  name: 'Muse-4A2F',
  model: 'Muse 2',
};

/** One of each quality so every label, color and fix is reviewable at once. */
export const MIXED_MUSE_SENSORS: SensorReading[] = [
  { channel: 'TP9', quality: SIGNAL_QUALITY.GREAT },
  { channel: 'AF7', quality: SIGNAL_QUALITY.OK },
  { channel: 'AF8', quality: SIGNAL_QUALITY.BAD },
  { channel: 'TP10', quality: SIGNAL_QUALITY.DISCONNECTED },
];
