import { Observable } from "rxjs";
import { map } from "rxjs/operators";

// TODO: This can be removed once PR is filed in eeg-pipes
export const addSignalQuality = () => source =>
  createPipe(
    source,
    map(epoch => ({
      ...epoch,
      signalQuality: epoch["data"].map(standardDeviation)
    }))
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
