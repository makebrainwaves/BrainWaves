import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import {
  SIGNAL_QUALITY,
  SIGNAL_QUALITY_THRESHOLDS
} from "../../constants/constants";

// TODO: This can be removed once PR is filed in eeg-pipes
export const addSignalQuality = () => source =>
  createPipe(
    source,
    map(epoch => {
      const names = epoch.info.channelNames
        ? epoch.info.channelNames
        : epoch.data.map((_, i) => i);
      return {
        ...epoch,
        signalQuality: epoch.data.reduce((acc, curr, index) => {
          acc[names[index]] = standardDeviation(curr);
          return acc;
        }, {})
      };
    })
  );

export const colorSignalQuality = () => source =>
  createPipe(
    source,
    map(
      epoch => ({
        ...epoch,
        signalQuality: Object.assign(
          {},
          ...Object.keys(epoch.signalQuality).map(channelName => {
            if (
              epoch.signalQuality[channelName] >= SIGNAL_QUALITY_THRESHOLDS.BAD
            ) {
              return { [channelName]: SIGNAL_QUALITY.BAD };
            }
            if (
              epoch.signalQuality[channelName] >= SIGNAL_QUALITY_THRESHOLDS.OK
            ) {
              return { [channelName]: SIGNAL_QUALITY.OK };
            }
            return { [channelName]: SIGNAL_QUALITY.GREAT };
          })
        )
      }),
      tap(console.log)
    )
  );

const mean = array => sum(array) / array.length;

const variance = array => {
  const arrayMean = mean(array);
  return mean(array.map(num => Math.pow(num - arrayMean, 2)));
};

const standardDeviation = array => Math.sqrt(variance(array));

const sum = array => {
  let num = 0;
  for (let i = 0, l = array.length; i < l; i++) {
    num += array[i];
  }
  return num;
};

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
