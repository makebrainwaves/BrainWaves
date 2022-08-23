import * as path from 'path';
import { readFileSync } from 'fs';
import { languagePluginLoader } from './pyodide';
import { formatFilePath } from './functions';

// ---------------------------------
// This file contains the JS functions that allow the app to access python-wasm through pyodide
// These functions wrap the python strings defined in the

// -----------------------------
// Imports and Utility functions

// Note: this takes an incredibly long time
export const loadPackages = async () => {
  await languagePluginLoader;
  console.log('loaded language plugin');
  // using window.pyodide instead of pyodide to get linter to stop yelling ;)
  await window.pyodide.loadPackage(['matplotlib', 'mne', 'pandas']);
  await window.pyodide.runPython('import js');
  console.log('loaded mne package');
};

export const loadUtils = async () =>
  window.pyodide.runPython(
    readFileSync(path.join(__dirname, '/utils/pyodide/utils.py'), 'utf8')
  );

export const loadCSV = async (csvArray: Array<any>) => {
  window.csvArray = csvArray;
  // TODO: Pass attached variable name as parameter to load_data
  await window.pyodide.runPython(`raw = load_data()`);
};

// ---------------------------
// MNE-Related Data Processing

// export const loadCleanedEpochs = (epocsArray: Array<any>) =>
//   [
//     `clean_epochs = concatenate_epochs([read_epochs(file) for file in files])`,
//     `conditions = OrderedDict({key: [value] for (key, value) in clean_epochs.event_id.items()})`
//   ].join("\n");

// NOTE: this command includes a ';' to prevent returning data
export const filterIIR = async (lowCutoff: number, highCutoff: number) =>
  window.pyodide.runPython(
    `raw.filter(${lowCutoff}, ${highCutoff}, method='iir');`
  );

export const epochEvents = async (
  eventIDs: { [string]: number },
  tmin: number,
  tmax: number,
  reject?: Array<string> | string = 'None'
) =>
  window.pyodide.runPython(
    [
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
      `conditions = OrderedDict({key: [value] for (key, value) in raw_epochs.event_id.items()})`
    ].join('\n')
  );

export const requestEpochsInfo = async (variableName: string) => {
  const pyodideReturn = await window.pyodide.runPython(
    `get_epochs_info(${variableName})`
  );
  return pyodideReturn;
};

export const requestChannelInfo = async () =>
  window.pyodide.runPython(
    `[ch for ch in clean_epochs.ch_names if ch != 'Marker']`
  );

// -----------------------------
// Plot functions

export const cleanEpochsPlot = async () => {
  // TODO: Figure out how to get image results from pyodide
  window.pyodide.runPython(
    `raw_epochs.plot(scalings='auto', n_epochs=6, title="Clean Data", events=None)`
  );
};

export const plotPSD = async () => {
  // TODO: Figure out how to get image results from pyodide
  window.pyodide.runPython(`raw.plot_psd(fmin=1, fmax=30)`);
};

export const plotTopoMap = async () => {
  // TODO: Figure out how to get image results from pyodide
  window.pyodide.runPython(`plot_topo(clean_epochs, conditions)`);
};

export const plotERP = (channelIndex: number) =>
  `X, y = plot_conditions(clean_epochs, ch_ind=${channelIndex}, conditions=conditions,
    ci=97.5, n_boot=1000, title='', diff_waveform=None)`;

export const saveEpochs = (workspaceDir: string, subject: string) =>
  window.pyodide.runPython(
    `raw_epochs.save(${formatFilePath(
      path.join(
        workspaceDir,
        'Data',
        subject,
        'EEG',
        `${subject}-cleaned-epo.fif`
      )
    )}`
  );
