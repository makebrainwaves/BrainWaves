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
        // @neurosity/pipes >=5 puts addSignalQuality()'s output under
        // info.signalQuality (older versions used a top-level field). Reading the
        // old top-level path yielded undefined → Object.entries() threw, which
        // killed the whole signal-quality/EEG stream to the viewer.
        ...Object.entries(epoch.info.signalQuality).map(
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

export const parseEmotivSignalQuality = () =>
  pipe(
    map((epoch: PipesEpoch) => ({
      ...epoch,
      signalQuality: Object.assign(
        {},
        ...Object.entries(epoch.signalQuality).map(
          ([channelName, signalQuality]) => {
            if (signalQuality === 0) {
              return { [channelName]: SIGNAL_QUALITY.DISCONNECTED };
            }
            if (signalQuality === 3) {
              return { [channelName]: SIGNAL_QUALITY.OK };
            }
            if (signalQuality === 4) {
              return { [channelName]: SIGNAL_QUALITY.GREAT };
            }
            return { [channelName]: SIGNAL_QUALITY.BAD };
          }
        )
      ),
    }))
  );
