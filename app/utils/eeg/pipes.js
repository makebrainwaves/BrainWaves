import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SIGNAL_QUALITY,
  SIGNAL_QUALITY_THRESHOLDS
} from '../../constants/constants';

export const parseMuseSignalQuality = () => source =>
  createPipe(
    source,
    map(epoch => ({
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
      )
    }))
  );

export const parseEmotivSignalQuality = () => source =>
  createPipe(
    source,
    map(epoch => ({
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
      )
    }))
  );

const createPipe = (source, ...pipes) =>
  new Observable(observer =>
    source.pipe(...pipes).subscribe({
      next(event) {
        observer.next(event);
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      }
    })
  );
