import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SIGNAL_QUALITY,
  SIGNAL_QUALITY_THRESHOLDS,
} from '../../constants/constants';
import { PipesEpoch } from '../../constants/interfaces';

export const parseMuseSignalQuality = () =>
  pipe(
    map((epoch: PipesEpoch) => ({
      ...epoch,
      signalQuality: Object.assign(
        {},
        ...Object.entries(epoch.signalQuality).map(
          ([channelName, signalQuality]) => {
            if (signalQuality >= SIGNAL_QUALITY_THRESHOLDS.BAD) {
              return { [channelName]: SIGNAL_QUALITY.BAD };
            }
            if (signalQuality >= SIGNAL_QUALITY_THRESHOLDS.OK) {
              return { [channelName]: SIGNAL_QUALITY.OK };
            }
            if (signalQuality >= SIGNAL_QUALITY_THRESHOLDS.GREAT) {
              return { [channelName]: SIGNAL_QUALITY.GREAT };
            }
            return { [channelName]: SIGNAL_QUALITY.DISCONNECTED };
          }
        )
      ),
    }))
  );
