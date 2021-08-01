import * as path from 'path';
import { readFileSync } from 'fs';
import { formatFilePath } from './functions';

// ---------------------------------
// This file contains the JS functions that allow the app to access python-wasm through pyodide
// These functions wrap the python strings defined in the

// -----------------------------
// Imports and Utility functions

export const loadPyodide = async () => {
  const freshWorker = await new Worker('./utils/pyodide/webworker.js');
  return freshWorker;
};

export const loadUtils = async (worker: Worker) =>
  worker.postMessage({
    data: readFileSync(path.join(__dirname, '/utils/pyodide/utils.py'), 'utf8'),
  });

export const loadCSV = async (worker: Worker, csvArray: Array<any>) => {
  // TODO: Pass attached variable name as parameter to load_data
  // @ts-expect-error
  window.csvArray = csvArray;
  await worker.postMessage({ data: `raw = load_data()` });
};

// ---------------------------
// MNE-Related Data Processing

export const loadCleanedEpochs = async (
  worker: Worker,
  epochsArray: string[]
) => {
  await worker.postMessage({
    data: [
      `clean_epochs = concatenate_epochs([read_epochs(file) for file in ${epochsArray}])`,
      `conditions = OrderedDict({key: [value] for (key, value) in clean_epochs.event_id.items()})`,
    ].join('\n'),
  });
};

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = async (
  worker: Worker,
  lowCutoff: number,
  highCutoff: number
) =>
  worker.postMessage({
    data: `raw.filter(${lowCutoff}, ${highCutoff}, method='iir');`,
  });

export const epochEvents = async (
  worker: Worker,
  eventIDs: { [k: string]: number },
  tmin: number,
  tmax: number,
  reject?: string[] | 'None'
) =>
  worker.postMessage({
    data: [
      `event_id = ${JSON.stringify(eventIDs)}`,
      `tmin=${tmin}`,
      `tmax=${tmax}`,
      `baseline= (tmin, tmax)`,
      `picks = None`,
      `reject = ${reject}`,
      'events = find_events(raw)',
      `raw_epochs = Epochs(raw, events=events, event_id=event_id,
                      tmin=tmin, tmax=tmax, baseline=baseline, reject=reject, preload=True,
                      verbose=False, picks=picks)`,
      `conditions = OrderedDict({key: [value] for (key, value) in raw_epochs.event_id.items()})`,
    ].join('\n'),
  });

export const requestEpochsInfo = async (
  worker: Worker,
  variableName: string
) => {
  const pyodideReturn = await worker.postMessage({
    data: `get_epochs_info(${variableName})`,
  });
  return pyodideReturn;
};

export const requestChannelInfo = async (worker: Worker) =>
  worker.postMessage({
    data: `[ch for ch in clean_epochs.ch_names if ch != 'Marker']`,
  });

// -----------------------------
// Plot functions

export const cleanEpochsPlot = async (worker: Worker) => {
  // TODO: Figure out how to get image results from pyodide
  await worker.postMessage({
    data: `raw_epochs.plot(scalings='auto', n_epochs=6, title="Clean Data", events=None)`,
  });
};

export const plotPSD = async (worker: Worker) => {
  // TODO: Figure out how to get image results from pyodide
  return worker.postMessage({ data: `raw.plot_psd(fmin=1, fmax=30)` });
};

export const plotTopoMap = async (worker: Worker) => {
  // TODO: Figure out how to get image results from pyodide
  return worker.postMessage({
    data: `plot_topo(clean_epochs, conditions)`,
  });
};

export const plotTestPlot = async (worker: Worker | null) => {
  if (!worker) {
    return;
  }
  // TODO: Figure out how to get image results from pyodide
  return worker.postMessage({
    data: `plt.plot([1,2,3,4])`,
  });
};

export const plotERP = async (worker: Worker, channelIndex: number) => {
  return worker.postMessage({
    data: `X, y = plot_conditions(clean_epochs, ch_ind=${channelIndex}, conditions=conditions,
      ci=97.5, n_boot=1000, title='', diff_waveform=None)`,
  });
};

export const saveEpochs = (
  worker: Worker,
  workspaceDir: string,
  subject: string
) =>
  worker.postMessage({
    data: `raw_epochs.save(${formatFilePath(
      path.join(
        workspaceDir,
        'Data',
        subject,
        'EEG',
        `${subject}-cleaned-epo.fif`
      )
    )}`,
  });
